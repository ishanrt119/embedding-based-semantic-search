from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from api.auth import get_current_user
from retrieval_engine.retrieval_service import retrieval_service

router = APIRouter()

async def get_current_user_id(current_user: dict = Depends(get_current_user)):
    return current_user["id"]

class RetrievalQuery(BaseModel):
    query: str
    top_k: int = 10
    dataset_id: Optional[str] = None
    max_tokens: int = 4000

@router.post("/")
async def retrieve_context(query: RetrievalQuery, user_id: str = Depends(get_current_user_id)):
    if not query.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")
        
    try:
        result = await retrieval_service.get_context(
            query=query.query,
            user_id=user_id,
            top_k=query.top_k,
            max_tokens=query.max_tokens,
            dataset_id=query.dataset_id
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
