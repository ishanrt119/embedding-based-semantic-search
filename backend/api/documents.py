from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, BackgroundTasks, Query
from typing import List, Optional
import shutil
import os
import uuid
import mimetypes
from services.logger import logger
from services.document_processor import process_document, validate_file, SUPPORTED_TYPES, MAX_FILE_SIZE
from database.repositories.user_repository import UserRepository
from database.repositories.document_repository import DocumentRepository
from database.repositories.chunk_repository import ChunkRepository

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

from api.auth import get_current_user

async def get_current_user_id(current_user: dict = Depends(get_current_user)):
    return current_user["id"]

@router.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id)
):
    logger.info(f"Upload start for user {user_id}: {file.filename}")
    
    # Sanitize original filename to prevent path traversal
    safe_original_filename = os.path.basename(file.filename)
    file_ext = safe_original_filename.split('.')[-1].upper() if '.' in safe_original_filename else ""
    
    if file_ext not in SUPPORTED_TYPES:
        logger.error(f"Upload failure: Unsupported file type {file_ext}")
        raise HTTPException(status_code=400, detail="Unsupported file type")
        
    document_id = str(uuid.uuid4())
    user_dir = os.path.join(UPLOAD_DIR, user_id, document_id)
    os.makedirs(user_dir, exist_ok=True)
    
    # Secure UUID-based filename
    stored_filename = f"{uuid.uuid4()}.{file_ext.lower()}"
    file_path = os.path.join(user_dir, stored_filename)
    
    try:
        size = 0
        with open(file_path, "wb") as buffer:
            while chunk := await file.read(1024 * 1024):
                size += len(chunk)
                if size > MAX_FILE_SIZE:
                    break
                buffer.write(chunk)
                
        if size > MAX_FILE_SIZE:
            os.remove(file_path)
            logger.error("Upload failure: File size exceeds 25MB")
            raise HTTPException(status_code=400, detail="File size exceeds maximum allowed size of 25 MB")
            
        # Create DB record
        document = await DocumentRepository.create_document(
            document_data={
                "id": document_id,
                "user_id": user_id,
                "filename": safe_original_filename,
                "original_filename": safe_original_filename,
                "file_type": file_ext,
                "file_size": size,
                "storage_path": file_path,
                "upload_status": "uploaded",
                "processing_status": "pending"
            }
        )
        logger.info(f"Upload success for document {document_id}")
        
        # Trigger processing
        background_tasks.add_task(process_document, document_id, file_path, file_ext)
        
        return {
            "document_id": document["id"],
            "filename": document["filename"],
            "file_type": document["file_type"],
            "status": document["upload_status"]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload failure: {str(e)}")
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail="Internal server error during upload")

@router.get("/")
async def get_documents(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    user_id: str = Depends(get_current_user_id)
):
    skip = (page - 1) * limit
    total = await DocumentRepository.count_documents_by_user(user_id)
    documents = await DocumentRepository.get_documents_by_user(user_id, skip=skip, limit=limit)
    
    for doc in documents:
        if "_id" in doc:
            doc["_id"] = str(doc["_id"])
    
    return {
        "data": documents,
        "pagination": {
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": (total + limit - 1) // limit
        }
    }

@router.get("/{document_id}")
async def get_document(document_id: str, user_id: str = Depends(get_current_user_id)):
    document = await DocumentRepository.get_document_by_id(document_id)
    if not document or document.get("user_id") != user_id:
        raise HTTPException(status_code=404, detail="Document not found")
    if "_id" in document:
        document["_id"] = str(document["_id"])
    return document

@router.delete("/{document_id}")
async def delete_document(document_id: str, user_id: str = Depends(get_current_user_id)):
    document = await DocumentRepository.get_document_by_id(document_id)
    if not document or document.get("user_id") != user_id:
        raise HTTPException(status_code=404, detail="Document not found")
        
    # Delete from DB
    await DocumentRepository.delete_document(document_id)
    
    # Delete file
    storage_path = document.get("storage_path")
    if storage_path and os.path.exists(storage_path):
        os.remove(storage_path)
        
    # Delete document directory if empty
    if storage_path:
        doc_dir = os.path.dirname(storage_path)
        if os.path.exists(doc_dir) and not os.listdir(doc_dir):
            shutil.rmtree(doc_dir)
        
    return {"message": "Document deleted successfully"}

from pydantic import BaseModel

class ChunkRequest(BaseModel):
    strategy: str = "recursive"
    chunk_size: int = 1000
    chunk_overlap: int = 200

from services.chunking.chunking_service import create_chunks, delete_chunks as delete_document_chunks, get_chunk_statistics

@router.post("/{document_id}/chunk")
async def process_chunking(document_id: str, request: ChunkRequest, user_id: str = Depends(get_current_user_id)):
    # Verify document ownership
    document = await DocumentRepository.get_document_by_id(document_id)
    if not document or document.get("user_id") != user_id:
        raise HTTPException(status_code=404, detail="Document not found")
        
    try:
        result = await create_chunks(
            document_id=document_id,
            strategy=request.strategy,
            chunk_size=request.chunk_size,
            overlap=request.chunk_overlap
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/{document_id}/rechunk")
async def process_rechunking(document_id: str, request: ChunkRequest, user_id: str = Depends(get_current_user_id)):
    # Verify document ownership
    document = await DocumentRepository.get_document_by_id(document_id)
    if not document or document.get("user_id") != user_id:
        raise HTTPException(status_code=404, detail="Document not found")
        
    try:
        await delete_document_chunks(document_id)
        result = await create_chunks(
            document_id=document_id,
            strategy=request.strategy,
            chunk_size=request.chunk_size,
            overlap=request.chunk_overlap
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/{document_id}/chunks")
async def get_document_chunks(
    document_id: str, 
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    user_id: str = Depends(get_current_user_id)
):
    document = await DocumentRepository.get_document_by_id(document_id)
    if not document or document.get("user_id") != user_id:
        raise HTTPException(status_code=404, detail="Document not found")
        
    skip = (page - 1) * limit
    total = await ChunkRepository.count_chunks_by_document(document_id, search)
    chunks = await ChunkRepository.get_chunks_by_document(document_id, skip=skip, limit=limit, search=search)
    
    for chunk in chunks:
        if "_id" in chunk:
            chunk["_id"] = str(chunk["_id"])
    
    return {
        "data": chunks,
        "pagination": {
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": (total + limit - 1) // limit
        }
    }

@router.delete("/{document_id}/chunks")
async def delete_all_chunks(document_id: str, user_id: str = Depends(get_current_user_id)):
    document = await DocumentRepository.get_document_by_id(document_id)
    if not document or document.get("user_id") != user_id:
        raise HTTPException(status_code=404, detail="Document not found")
        
    await delete_document_chunks(document_id)
    return {"message": "Chunks deleted successfully"}

@router.get("/{document_id}/chunk-stats")
async def get_document_chunk_stats(document_id: str, user_id: str = Depends(get_current_user_id)):
    document = await DocumentRepository.get_document_by_id(document_id)
    if not document or document.get("user_id") != user_id:
        raise HTTPException(status_code=404, detail="Document not found")
        
    stats = await get_chunk_statistics(document_id)
    return stats

from database.repositories.embedding_repository import EmbeddingRepository
from database.repositories.job_repository import JobRepository
from embeddings.embedding_service import generate_embeddings_background, delete_embeddings

class EmbeddingRequest(BaseModel):
    model_name: str = "sentence-transformers/all-MiniLM-L6-v2"
    batch_size: int = 64

@router.post("/{document_id}/embeddings/generate")
async def generate_embeddings_endpoint(
    document_id: str, 
    request: EmbeddingRequest,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user_id)
):
    document = await DocumentRepository.get_document_by_id(document_id)
    if not document or document.get("user_id") != user_id:
        raise HTTPException(status_code=404, detail="Document not found")
        
    total_chunks = await ChunkRepository.count_chunks_by_document(document_id)
    if total_chunks == 0:
        raise HTTPException(status_code=400, detail="No chunks found. Please generate chunks first.")
        
    job = await JobRepository.create_job(document_id, total_chunks, request.model_name)
    
    background_tasks.add_task(
        generate_embeddings_background,
        job_id=job["id"],
        document_id=document_id,
        user_id=user_id,
        model_name=request.model_name,
        batch_size=request.batch_size
    )
    
    return {
        "document_id": document_id,
        "total_chunks": total_chunks,
        "model": request.model_name,
        "status": "started",
        "job_id": job["id"]
    }

@router.get("/{document_id}/embeddings/status")
async def get_embedding_status(document_id: str, user_id: str = Depends(get_current_user_id)):
    document = await DocumentRepository.get_document_by_id(document_id)
    if not document or document.get("user_id") != user_id:
        raise HTTPException(status_code=404, detail="Document not found")
        
    job = await JobRepository.get_job_by_document(document_id)
    if not job:
        raise HTTPException(status_code=404, detail="No embedding job found for this document")
        
    if "_id" in job:
        job["_id"] = str(job["_id"])
        
    return job

@router.get("/{document_id}/embeddings")
async def get_document_embeddings(
    document_id: str, 
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    user_id: str = Depends(get_current_user_id)
):
    document = await DocumentRepository.get_document_by_id(document_id)
    if not document or document.get("user_id") != user_id:
        raise HTTPException(status_code=404, detail="Document not found")
        
    skip = (page - 1) * limit
    total = await EmbeddingRepository.count_embeddings_by_document(document_id)
    embeddings = await EmbeddingRepository.get_embeddings_by_document(document_id, skip=skip, limit=limit)
    
    for emb in embeddings:
        if "_id" in emb:
            emb["_id"] = str(emb["_id"])
    
    return {
        "data": embeddings,
        "pagination": {
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": (total + limit - 1) // limit if limit > 0 else 0
        }
    }

@router.delete("/{document_id}/embeddings")
async def delete_document_embeddings(document_id: str, user_id: str = Depends(get_current_user_id)):
    document = await DocumentRepository.get_document_by_id(document_id)
    if not document or document.get("user_id") != user_id:
        raise HTTPException(status_code=404, detail="Document not found")
        
    await delete_embeddings(document_id)
    return {"message": "Embeddings deleted successfully"}

@router.post("/{document_id}/embeddings/regenerate")
async def regenerate_embeddings_endpoint(
    document_id: str, 
    request: EmbeddingRequest,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user_id)
):
    document = await DocumentRepository.get_document_by_id(document_id)
    if not document or document.get("user_id") != user_id:
        raise HTTPException(status_code=404, detail="Document not found")
        
    total_chunks = await ChunkRepository.count_chunks_by_document(document_id)
    if total_chunks == 0:
        raise HTTPException(status_code=400, detail="No chunks found. Please generate chunks first.")
        
    await delete_embeddings(document_id)
    
    job = await JobRepository.create_job(document_id, total_chunks, request.model_name)
    
    background_tasks.add_task(
        generate_embeddings_background,
        job_id=job["id"],
        document_id=document_id,
        user_id=user_id,
        model_name=request.model_name,
        batch_size=request.batch_size
    )
    
    return {
        "document_id": document_id,
        "total_chunks": total_chunks,
        "model": request.model_name,
        "status": "started",
        "job_id": job["id"]
    }
