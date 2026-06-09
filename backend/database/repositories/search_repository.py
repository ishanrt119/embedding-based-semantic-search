from database.mongodb import db_client
from typing import Dict, Any
from datetime import datetime
import uuid

class SearchRepository:
    @staticmethod
    def get_collection():
        return db_client.db.search_history

    @staticmethod
    async def log_search(user_id: str, query: str, search_type: str, results_count: int, latency_ms: float) -> Dict[str, Any]:
        search_doc = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "query": query,
            "search_type": search_type,
            "results_count": results_count,
            "latency_ms": latency_ms,
            "created_at": datetime.utcnow()
        }
        await SearchRepository.get_collection().insert_one(search_doc)
        return search_doc
