import time
from typing import List, Dict, Any, Optional
from vectorstore.index_manager import index_manager
from database.repositories.chunk_repository import ChunkRepository
from database.repositories.document_repository import DocumentRepository
from embeddings.model_registry import ModelRegistry
from fastapi import HTTPException

async def get_query_embedding(query_text: str, user_id: str, dataset_id: Optional[str] = None):
    model_name = None
    
    # Detect model used for indexed document
    if dataset_id and dataset_id != "all":
        doc = await DocumentRepository.get_document_by_id(dataset_id)
        if doc:
            model_name = doc.get("embedding_model")
            
    # Fallback to the user's most recent document model
    if not model_name:
        user_docs = await DocumentRepository.get_documents_by_user(user_id, limit=1)
        if user_docs:
            model_name = user_docs[0].get("embedding_model")
            
    if not model_name:
        raise HTTPException(status_code=400, detail="No embedding model found for user documents. Please embed a document first.")
        
    try:
        model = ModelRegistry.get_model(model_name)
        return model.embed_batch([query_text])[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load model {model_name}: {str(e)}")

async def semantic_search(query: str, user_id: str, top_k: int = 20, dataset_id: Optional[str] = None) -> List[Dict[str, Any]]:
    if not query.strip():
        return []
        
    query_emb = await get_query_embedding(query, user_id, dataset_id)
    
    # Search more vectors for filtering
    search_k = top_k * 5
    faiss_results = await index_manager.search(user_id, query_emb, top_k=search_k)
    
    formatted_results = []
    
    for res in faiss_results:
        chunk_id = res.get("chunk_id")
        document_id = res.get("document_id")
        
        if not chunk_id or not document_id:
            continue
            
        doc_metadata = await DocumentRepository.get_document_by_id(document_id)
        if not doc_metadata or doc_metadata.get("user_id") != user_id:
            continue
            
        doc_dataset_id = doc_metadata.get("id")
        
        if dataset_id and dataset_id != "all" and document_id != dataset_id:
            continue
            
        chunk_metadata = await ChunkRepository.get_chunk_by_id(chunk_id)
        if not chunk_metadata:
            continue
            
        chunk_text = chunk_metadata.get("content", "")
        chunk_preview = chunk_text[:200] + "..." if len(chunk_text) > 200 else chunk_text
        
        formatted_results.append({
            "chunk_id": chunk_id,
            "chunk_preview": chunk_preview,
            "content": chunk_text,
            "document_id": document_id,
            "dataset_id": doc_dataset_id,
            "page_number": chunk_metadata.get("page_number"),
            "similarity_score": res.get("similarity_score"),
            "raw_distance": res.get("raw_distance"),
            "created_at": chunk_metadata.get("created_at"),
            "document_name": doc_metadata.get("original_filename", doc_metadata.get("filename", "Unknown Document"))
        })
        
        if len(formatted_results) >= top_k:
            break
            
    return formatted_results
