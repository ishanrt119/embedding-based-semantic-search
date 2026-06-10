from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import time

from api.auth import get_current_user
from vectorstore.index_manager import index_manager
from database.repositories.search_repository import SearchRepository

from search_engine.semantic_search import semantic_search
from search_engine.bm25_search import bm25_search
from search_engine.hybrid_search import hybrid_search

router = APIRouter()

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

@router.post("/semantic")
async def semantic_search_endpoint(query: SemanticSearchQuery, user_id: str = Depends(get_current_user_id)):
    start_time = time.time()
    
    results = await semantic_search(query.query, user_id, query.top_k, query.dataset_id)
    
    latency = (time.time() - start_time) * 1000
    await SearchRepository.log_search(user_id, query.query, "semantic", len(results), latency)
    
    return {
        "query": query.query,
        "results": results,
        "latency_ms": latency
    }

class SearchQuery(BaseModel):
    query: str
    top_k: int = 10
    search_type: str = "hybrid" # 'semantic', 'keyword', 'hybrid'
    dataset_id: Optional[str] = None

@router.post("/")
async def unified_search(query: SearchQuery, user_id: str = Depends(get_current_user_id)):
    start_time = time.time()
    
    if query.search_type == "keyword":
        results = await bm25_search(query.query, user_id, query.top_k, query.dataset_id)
    elif query.search_type == "semantic":
        results = await semantic_search(query.query, user_id, query.top_k, query.dataset_id)
    else:
        results = await hybrid_search(query.query, user_id, query.top_k, query.dataset_id)
        
    latency = (time.time() - start_time) * 1000
    await SearchRepository.log_search(user_id, query.query, query.search_type, len(results), latency)
    
    return {
        "query": query.query,
        "mode": query.search_type,
        "results": results,
        "latency_ms": latency
    }

@router.get("/history")
async def get_search_history(user_id: str = Depends(get_current_user_id), limit: int = 20):
    cursor = SearchRepository.get_collection().find({"user_id": user_id}).sort("created_at", -1).limit(limit)
    history = await cursor.to_list(length=limit)
    for h in history:
        if "_id" in h:
            h["_id"] = str(h["_id"])
    return history
