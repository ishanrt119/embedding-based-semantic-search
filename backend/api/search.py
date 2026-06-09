from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from vectorstore.faiss_store import faiss_store
from embeddings.generator import generate_embedding
from rank_bm25 import BM25Okapi
import time
from database.repositories.search_repository import SearchRepository
from database.repositories.chunk_repository import ChunkRepository
from database.repositories.user_repository import UserRepository

router = APIRouter()

class SearchQuery(BaseModel):
    query: str
    top_k: int = 5
    search_type: str = "hybrid" # 'semantic', 'keyword', 'hybrid'

from api.auth import get_current_user

async def get_current_user_id(current_user: dict = Depends(get_current_user)):
    return current_user["id"]

@router.post("/")
async def search(query: SearchQuery, user_id: str = Depends(get_current_user_id)):
    start_time = time.time()
    
    # 1. Semantic Search (Vector)
    query_emb = generate_embedding(query.query)
    semantic_results = faiss_store.search(query_emb, top_k=query.top_k)
    
    # Enrich semantic results from MongoDB
    enriched_semantic_results = []
    for res in semantic_results:
        chunk_id = res.get("id")
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
