from database.mongodb import db_client
from typing import Dict, Any
from datetime import datetime
import uuid

class ChatAnalyticsRepository:
    @staticmethod
    def get_collection():
        return db_client.db.chat_history

    @staticmethod
    async def log_analytics(
        user_id: str,
        question: str,
        answer_length: int,
        retrieval_time_ms: float,
        generation_time_ms: float,
        citation_count: int,
        total_latency_ms: float
    ) -> Dict[str, Any]:
        """
        Logs RAG chat analytics to MongoDB.
        """
        doc = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "question": question,
            "answer_length": answer_length,
            "retrieval_time_ms": retrieval_time_ms,
            "generation_time_ms": generation_time_ms,
            "citation_count": citation_count,
            "total_latency_ms": total_latency_ms,
            "created_at": datetime.utcnow()
        }
        await ChatAnalyticsRepository.get_collection().insert_one(doc)
        return doc
