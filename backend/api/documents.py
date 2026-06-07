from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, BackgroundTasks, Query
from typing import List, Optional
from database.client import db
import shutil
import os
import uuid
import mimetypes
from services.logger import logger
from services.document_processor import process_document, validate_file, SUPPORTED_TYPES, MAX_FILE_SIZE

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Mock dependency for getting current user (should use JWT token logic)
async def get_current_user_id():
    # In a real app, this parses the JWT token
    # For now, we assume a mock user ID or fetch the first user
    user = await db.user.find_first()
    if not user:
        # Create a dummy user for testing if none exists
        user = await db.user.create(data={"email": "test@example.com", "password": "dummy"})
    return user.id

@router.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id)
):
    logger.info(f"Upload start for user {user_id}: {file.filename}")
    
    file_ext = file.filename.split('.')[-1].upper() if '.' in file.filename else ""
    mime_type, _ = mimetypes.guess_type(file.filename)
    
    if file_ext not in SUPPORTED_TYPES:
        logger.error(f"Upload failure: Unsupported file type {file_ext}")
        raise HTTPException(status_code=400, detail="Unsupported file type")
        
    # Read to check file size (can't just use os.path.getsize yet as it's not saved)
    # A cleaner way is reading chunks but for simplicity we'll check it before saving or during save
    # Let's save it first and check, or we can check header `content-length` but it can be spoofed.
    # We will read into memory or save to a temp path, let's just save it to its final path.
    
    document_id = str(uuid.uuid4())
    user_dir = os.path.join(UPLOAD_DIR, user_id, document_id)
    os.makedirs(user_dir, exist_ok=True)
    
    file_path = os.path.join(user_dir, file.filename)
    
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
        document = await db.document.create(
            data={
                "id": document_id,
                "user_id": user_id,
                "filename": file.filename,
                "original_filename": file.filename,
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
            "document_id": document.id,
            "filename": document.filename,
            "file_type": document.file_type,
            "status": document.upload_status
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
    total = await db.document.count(where={"user_id": user_id})
    documents = await db.document.find_many(
        where={"user_id": user_id},
        skip=skip,
        take=limit,
        order={"created_at": "desc"}
    )
    
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
    document = await db.document.find_unique(where={"id": document_id})
    if not document or document.user_id != user_id:
        raise HTTPException(status_code=404, detail="Document not found")
    return document

@router.delete("/{document_id}")
async def delete_document(document_id: str, user_id: str = Depends(get_current_user_id)):
    document = await db.document.find_unique(where={"id": document_id})
    if not document or document.user_id != user_id:
        raise HTTPException(status_code=404, detail="Document not found")
        
    # Delete from DB
    await db.document.delete(where={"id": document_id})
    
    # Delete file
    if document.storage_path and os.path.exists(document.storage_path):
        os.remove(document.storage_path)
        
    # Delete document directory if empty
    doc_dir = os.path.dirname(document.storage_path)
    if os.path.exists(doc_dir) and not os.listdir(doc_dir):
        shutil.rmtree(doc_dir)
        
    return {"message": "Document deleted successfully"}

from pydantic import BaseModel

class ChunkRequest(BaseModel):
    strategy: str = "recursive"
    chunk_size: int = 1000
    overlap: int = 200

from services.chunking_service import create_chunks, delete_chunks as delete_document_chunks, get_chunk_statistics

@router.post("/{document_id}/chunk")
async def process_chunking(document_id: str, request: ChunkRequest, user_id: str = Depends(get_current_user_id)):
    # Verify document ownership
    document = await db.document.find_unique(where={"id": document_id})
    if not document or document.user_id != user_id:
        raise HTTPException(status_code=404, detail="Document not found")
        
    try:
        result = await create_chunks(
            document_id=document_id,
            strategy=request.strategy,
            chunk_size=request.chunk_size,
            overlap=request.overlap
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
    user_id: str = Depends(get_current_user_id)
):
    document = await db.document.find_unique(where={"id": document_id})
    if not document or document.user_id != user_id:
        raise HTTPException(status_code=404, detail="Document not found")
        
    skip = (page - 1) * limit
    total = await db.chunk.count(where={"document_id": document_id})
    chunks = await db.chunk.find_many(
        where={"document_id": document_id},
        skip=skip,
        take=limit,
        order={"chunk_index": "asc"}
    )
    
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
    document = await db.document.find_unique(where={"id": document_id})
    if not document or document.user_id != user_id:
        raise HTTPException(status_code=404, detail="Document not found")
        
    await delete_document_chunks(document_id)
    return {"message": "Chunks deleted successfully"}

@router.get("/{document_id}/chunk-stats")
async def get_document_chunk_stats(document_id: str, user_id: str = Depends(get_current_user_id)):
    document = await db.document.find_unique(where={"id": document_id})
    if not document or document.user_id != user_id:
        raise HTTPException(status_code=404, detail="Document not found")
        
    stats = await get_chunk_statistics(document_id)
    return stats
