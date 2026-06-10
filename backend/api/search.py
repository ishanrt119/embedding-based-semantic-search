from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from vectorstore.index_manager import index_manager
from embeddings.generator import generate_embedding
from rank_bm25 import BM25Okapi
import time
from database.repositories.search_repository import SearchRepository
from database.repositories.chunk_repository import ChunkRepository
from database.repositories.user_repository import UserRepository
from database.repositories.document_repository import DocumentRepository

router = APIRouter()

class SearchQuery(BaseModel):
    query: str
    top_k: int = 5
    search_type: str = "hybrid" # 'semantic', 'keyword', 'hybrid'

from api.auth import get_current_user

async def get_current_user_id(current_user: dict = Depends(get_current_user)):
    return current_user["id"]

@router.get("/stats")
async def get_index_stats(user_id: str = Depends(get_current_user_id)):
    stats = index_manager.get_stats(user_id)
    return stats

class SemanticSearchQuery(BaseModel):
    query: str
    top_k: int = 10
    dataset_id: Optional[str] = None
    filters: Optional[Dict[str, Any]] = None

from embeddings.model_registry import ModelRegistry
from fastapi import HTTPException

async def get_query_embedding(query_text: str, user_id: str, dataset_id: Optional[str] = None):
    model_name = None
    
    # 1. Detect model used for indexed document
    if dataset_id and dataset_id != "all":
        doc = await DocumentRepository.get_document_by_id(dataset_id)
        if doc:
            model_name = doc.get("embedding_model")
            
    # Fallback to the user's most recent document model if global search
    if not model_name:
        user_docs = await DocumentRepository.get_documents_by_user(user_id, limit=1)
        if user_docs:
            model_name = user_docs[0].get("embedding_model")
            
    if not model_name:
        raise HTTPException(status_code=400, detail="No embedding model found for user documents. Please embed a document first.")
        
    # 2. Generate query embedding using the same model
    try:
        model = ModelRegistry.get_model(model_name)
        return model.embed_batch([query_text])[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load model {model_name}: {str(e)}")

@router.post("/semantic")
async def semantic_search(query: SemanticSearchQuery, user_id: str = Depends(get_current_user_id)):
    start_time = time.time()
    
    if not query.query.strip():
        return {"query": query.query, "results": [], "latency_ms": 0}
        
    query_emb = await get_query_embedding(query.query, user_id, query.dataset_id)
    
    # Retrieve top_k * 5 to allow for filtering
    search_k = query.top_k * 5
    faiss_results = await index_manager.search(user_id, query_emb, top_k=search_k)
    
    formatted_results = []
    
    for res in faiss_results:
        chunk_id = res.get("chunk_id")
        document_id = res.get("document_id")
        
        if not chunk_id or not document_id:
            continue
            
        # Fetch Document to check dataset_id and get document_name
        doc_metadata = await DocumentRepository.get_document_by_id(document_id)
        if not doc_metadata or doc_metadata.get("user_id") != user_id:
            continue
            
        doc_dataset_id = doc_metadata.get("dataset_id")
        
        # Apply dataset filter
        if query.dataset_id and query.dataset_id != "all" and doc_dataset_id != query.dataset_id:
            continue
            
        # Fetch chunk content
        chunk_metadata = await ChunkRepository.get_chunk_by_id(chunk_id)
        if not chunk_metadata:
            continue
            
        chunk_text = chunk_metadata.get("content", "")
        # For preview, just take first 200 chars
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
        
        if len(formatted_results) >= query.top_k:
            break
            
    latency = (time.time() - start_time) * 1000
    
    await SearchRepository.log_search(user_id, query.query, "semantic", len(formatted_results), latency)
    
    final_response = {
        "query": query.query,
        "results": formatted_results,
        "latency_ms": latency
    }
    
    return final_response

class VectorSearchQuery(BaseModel):
    query: str
    top_k: int = 5

@router.post("/vector")
async def vector_search(query: VectorSearchQuery, user_id: str = Depends(get_current_user_id)):
    start_time = time.time()
    
    query_emb = await get_query_embedding(query.query, user_id)
    
    # Use index_manager to search isolated FAISS index
    results = await index_manager.search(user_id, query_emb, top_k=query.top_k)
    
    # Enrich with chunk contents
    for res in results:
        chunk_id = res.get("chunk_id")
        if chunk_id:
            chunk_metadata = await ChunkRepository.get_chunk_by_id(chunk_id)
            if chunk_metadata:
                if "_id" in chunk_metadata:
                    chunk_metadata["_id"] = str(chunk_metadata["_id"])
                res["chunk_content"] = chunk_metadata.get("content", "")
                
    latency = (time.time() - start_time) * 1000
    
    return {
        "results": results,
        "latency_ms": latency
    }

@router.post("/")
async def search(query: SearchQuery, user_id: str = Depends(get_current_user_id)):
    start_time = time.time()
    
    # 1. Semantic Search (Vector)
    query_emb = await get_query_embedding(query.query, user_id)
    semantic_results = await index_manager.search(user_id, query_emb, top_k=query.top_k)
    
    # Enrich semantic results from MongoDB
    enriched_semantic_results = []
    for res in semantic_results:
        chunk_id = res.get("chunk_id")
        if chunk_id:
            chunk_metadata = await ChunkRepository.get_chunk_by_id(chunk_id)
            if chunk_metadata:
                # Merge MongoDB metadata
                if "_id" in chunk_metadata:
                    chunk_metadata["_id"] = str(chunk_metadata["_id"])
                res.update({"metadata": chunk_metadata})
        enriched_semantic_results.append(res)
    
    if query.search_type == "semantic":
        latency = (time.time() - start_time) * 1000
        await SearchRepository.log_search(user_id, query.query, query.search_type, len(enriched_semantic_results), latency)
        return {"results": enriched_semantic_results, "type": "semantic"}
        
    # 2. Keyword Search (BM25) Mock
    documents = [res.get("content", "") for res in enriched_semantic_results] if enriched_semantic_results else []
    tokenized_corpus = [doc.split(" ") for doc in documents]
    
    if not tokenized_corpus:
        latency = (time.time() - start_time) * 1000
        await SearchRepository.log_search(user_id, query.query, query.search_type, 0, latency)
        return {"results": [], "type": query.search_type}
        
    bm25 = BM25Okapi(tokenized_corpus)
    tokenized_query = query.query.split(" ")
    doc_scores = bm25.get_scores(tokenized_query)
    
    # 3. Hybrid Search
    hybrid_results = []
    for i, res in enumerate(enriched_semantic_results):
        bm25_score = doc_scores[i]
        vector_score = res["score"]
        
        final_score = (0.3 * bm25_score) + (0.7 * (1.0 / (1.0 + vector_score)))
        
        res_copy = res.copy()
        res_copy["hybrid_score"] = final_score
        res_copy["keyword_score"] = bm25_score
        hybrid_results.append(res_copy)
        
    hybrid_results = sorted(hybrid_results, key=lambda x: x["hybrid_score"], reverse=True)
    
    if query.search_type == "keyword":
        keyword_results = sorted(hybrid_results, key=lambda x: x["keyword_score"], reverse=True)
        latency = (time.time() - start_time) * 1000
        await SearchRepository.log_search(user_id, query.query, query.search_type, len(keyword_results), latency)
        return {"results": keyword_results, "type": "keyword"}
        
    latency = (time.time() - start_time) * 1000
    await SearchRepository.log_search(user_id, query.query, query.search_type, len(hybrid_results), latency)
    return {"results": hybrid_results, "type": "hybrid"}

@router.get("/history")
async def get_search_history(user_id: str = Depends(get_current_user_id), limit: int = 20):
    cursor = SearchRepository.get_collection().find({"user_id": user_id}).sort("created_at", -1).limit(limit)
    history = await cursor.to_list(length=limit)
    for h in history:
        if "_id" in h:
            h["_id"] = str(h["_id"])
    return history
