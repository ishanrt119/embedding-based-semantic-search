import time
import math
from typing import List, Dict, Any
from services.logger import logger
from database.repositories.chunk_repository import ChunkRepository
from database.repositories.document_repository import DocumentRepository
from database.repositories.embedding_repository import EmbeddingRepository
from database.repositories.job_repository import JobRepository
from .model_registry import ModelRegistry

async def delete_embeddings(document_id: str):
    """Delete all embeddings and jobs for a document, reset status."""
    await EmbeddingRepository.delete_embeddings_by_document(document_id)
    await JobRepository.delete_jobs_by_document(document_id)
    
    doc = await DocumentRepository.get_document_by_id(document_id)
    if doc and doc.get("processing_status") in ["embedding", "embedded", "indexed"]:
        # If it was in one of these statuses, revert to chunked
        await DocumentRepository.update_document(
            document_id=document_id,
            data={"processing_status": "chunked"}
        )

async def generate_embeddings_background(job_id: str, document_id: str, user_id: str, model_name: str, batch_size: int = 64):
    """Background task to generate embeddings iteratively."""
    start_time = time.time()
    try:
        logger.info(f"Starting embedding job {job_id} for document {document_id}")
        
        await DocumentRepository.update_document(
            document_id=document_id,
            data={"processing_status": "embedding"}
        )
        
        await JobRepository.update_job(job_id, {"current_status": "processing"})
        
        model = ModelRegistry.get_model(model_name)
        chunks = await ChunkRepository.get_all_chunks_by_document(document_id)
        total_chunks = len(chunks)
        
        if total_chunks == 0:
            raise ValueError("No chunks found for document.")
            
        processed_chunks = 0
        total_batches = math.ceil(total_chunks / batch_size)
        
        for batch_idx in range(total_batches):
            batch_start = batch_idx * batch_size
            batch_end = min((batch_idx + 1) * batch_size, total_chunks)
            batch_chunks = chunks[batch_start:batch_end]
            
            texts = [c["content"] for c in batch_chunks]
            
            # This is CPU intensive, potentially blocking event loop, but we accept it for now or use asyncio.to_thread
            import asyncio
            vectors = await asyncio.to_thread(model.embed_batch, texts)
            
            # Prepare metadata for MongoDB (We explicitly DO NOT store the raw vectors per prompt instructions)
            # Vectors will later be stored in FAISS in Module 4.
            embeddings_metadata = []
            for i, chunk in enumerate(batch_chunks):
                embeddings_metadata.append({
                    "chunk_id": chunk["id"] if "id" in chunk else str(chunk["_id"]),
                    "document_id": document_id,
                    "user_id": user_id,
                    "embedding_model": model_name,
                    "vector_dimension": model.dimension,
                    "embedding_status": "computed"
                })
                
            await EmbeddingRepository.create_embeddings(embeddings_metadata)
            
            processed_chunks += len(batch_chunks)
            percentage_complete = int((processed_chunks / total_chunks) * 100)
            
            # Update live tracking
            elapsed_ms = int((time.time() - start_time) * 1000)
            await JobRepository.update_job(job_id, {
                "processed_chunks": processed_chunks,
                "percentage_complete": percentage_complete,
                "processing_time_ms": elapsed_ms
            })
            
        # Completion
        final_time_ms = int((time.time() - start_time) * 1000)
        await JobRepository.update_job(job_id, {
            "current_status": "completed",
            "processing_time_ms": final_time_ms,
            "percentage_complete": 100
        })
        
        await DocumentRepository.update_document(
            document_id=document_id,
            data={"processing_status": "embedded"}
        )
        
        logger.info(f"Completed embedding job {job_id} in {final_time_ms}ms")
        
    except Exception as e:
        logger.error(f"Embedding job {job_id} failed: {e}")
        await JobRepository.update_job(job_id, {"current_status": "failed"})
        await DocumentRepository.update_document(
            document_id=document_id,
            data={"processing_status": "failed"}
        )
