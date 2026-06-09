import time
import statistics
from typing import List, Dict, Any, Optional

from services.logger import logger
from database.repositories.chunk_repository import ChunkRepository
from database.repositories.document_repository import DocumentRepository
from services.document_processor import extract_text

from .fixed_chunker import FixedChunker
from .recursive_chunker import RecursiveChunker
from .semantic_chunker import SemanticChunker

def get_chunker(strategy: str, chunk_size: int, overlap: int):
    if strategy == "fixed":
        return FixedChunker(chunk_size, overlap)
    elif strategy == "semantic":
        return SemanticChunker(chunk_size, overlap)
    else:
        return RecursiveChunker(chunk_size, overlap)

async def delete_chunks(document_id: str):
    """Delete all chunks for a document and update status."""
    await ChunkRepository.delete_chunks_by_document(document_id)
    await DocumentRepository.update_document(
        document_id=document_id,
        data={"processing_status": "extracted"}
    )

async def get_chunk_statistics(document_id: str) -> Dict[str, Any]:
    """Calculate and return statistics about chunks for a document."""
    chunks = await ChunkRepository.get_all_chunks_by_document(document_id)
    
    if not chunks:
        return {
            "total_chunks": 0,
            "avg_tokens": 0,
            "avg_characters": 0,
            "largest_chunk": 0,
            "smallest_chunk": 0,
            "chunk_variance": 0
        }
        
    char_counts = [len(c["content"]) for c in chunks]
    token_counts = [c["token_count"] for c in chunks]
    
    avg_chars = sum(char_counts) / len(char_counts)
    
    variance = 0
    if len(char_counts) > 1:
        variance = statistics.variance(char_counts)
        
    return {
        "total_chunks": len(chunks),
        "avg_tokens": int(sum(token_counts) / len(token_counts)),
        "avg_characters": int(avg_chars),
        "largest_chunk": max(char_counts),
        "smallest_chunk": min(char_counts),
        "chunk_variance": int(variance),
        "token_distribution": {
            "min": min(token_counts),
            "max": max(token_counts),
        }
    }

async def create_chunks(document_id: str, strategy: str = "recursive", chunk_size: int = 1000, overlap: int = 200) -> Dict[str, Any]:
    """Orchestrate the chunking process."""
    start_time = time.time()
    
    try:
        logger.info(f"Chunk creation started for {document_id} using {strategy} strategy")
        
        await DocumentRepository.update_document(
            document_id=document_id,
            data={"processing_status": "chunking"}
        )
        
        document = await DocumentRepository.get_document_by_id(document_id)
        if not document:
            raise ValueError("Document not found")
            
        try:
            pages = extract_text(document["storage_path"], document["file_type"])
        except Exception as e:
            raise ValueError(f"Failed to extract text: {e}")
            
        if not pages:
            raise ValueError("Document is empty or has no extracted text")
            
        await delete_chunks(document_id)
        
        chunker = get_chunker(strategy, chunk_size, overlap)
        chunks_data = chunker.chunk_document(pages)
        
        if not chunks_data:
            raise ValueError("No valid chunks were generated.")
            
        # Add metadata to chunks
        for i, chunk in enumerate(chunks_data):
            chunk["document_id"] = document_id
            chunk["user_id"] = document["user_id"]
            chunk["chunk_index"] = i
            
        await ChunkRepository.create_chunks(chunks_data)
        
        # Removing FAISS insertion from chunking pipeline
        # Embeddings will be handled in the embedding service pipeline
        
        await DocumentRepository.update_document(
            document_id=document_id,
            data={"processing_status": "chunked"} 
        )
        
        duration = (time.time() - start_time) * 1000 # in ms
        logger.info(f"Chunk creation completed for {document_id}. Strategy: {strategy}. Time: {duration:.2f}ms")
        
        return {
            "document_id": document_id,
            "total_chunks": len(chunks_data),
            "strategy": strategy,
            "processing_time_ms": int(duration)
        }
        
    except Exception as e:
        logger.error(f"Chunk creation failed for {document_id}: {str(e)}")
        await DocumentRepository.update_document(
            document_id=document_id,
            data={"processing_status": "failed"}
        )
        raise e
