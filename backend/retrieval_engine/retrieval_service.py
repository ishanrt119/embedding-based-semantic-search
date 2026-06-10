from typing import Dict, Any, Optional
from .retriever import retriever

class RetrievalService:
    @staticmethod
    async def get_context(
        query: str, 
        user_id: str, 
        top_k: int = 10, 
        max_tokens: int = 4000,
        dataset_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Service layer wrapper for Retriever.
        Handles high level orchestration and could incorporate caching or access checks.
        """
        return await retriever.retrieve_context(
            query=query,
            user_id=user_id,
            top_k=top_k,
            max_tokens=max_tokens,
            dataset_id=dataset_id
        )

retrieval_service = RetrievalService()
