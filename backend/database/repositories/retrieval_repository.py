from database.mongodb import db_client
from typing import Dict, Any, Optional
from datetime import datetime
import uuid

class RetrievalRepository:
    @staticmethod
    def get_collection():
        return db_client.db.retrieval_history

    @staticmethod
    async def log_retrieval(
        user_id: str,
        query: str,
        dataset_id: Optional[str],
        returned_chunks: int,
        total_tokens: int,
        latency_ms: float,
        avg_score: float
    ) -> Dict[str, Any]:
        """
        Logs a retrieval operation to MongoDB for analytics.
        """
        doc = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "query": query,
            "dataset_id": dataset_id,
            "returned_chunks": returned_chunks,
            "total_tokens": total_tokens,
            "latency_ms": latency_ms,
            "avg_score": avg_score,
            "created_at": datetime.utcnow()
        }
        await RetrievalRepository.get_collection().insert_one(doc)
        return doc
