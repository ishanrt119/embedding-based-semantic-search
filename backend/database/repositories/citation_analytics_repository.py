from database.mongodb import db_client
from typing import Dict, Any, List
from datetime import datetime
import uuid

class CitationAnalyticsRepository:
    @staticmethod
    def get_collection():
        return db_client.db.citation_analytics

    @staticmethod
    async def log_citations(
        user_id: str,
        question: str,
        citations: List[Dict[str, Any]],
        avg_confidence: float
    ) -> Dict[str, Any]:
        """
        Logs citation-specific analytics to MongoDB.
        """
        doc = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "question": question,
            "total_citations": len(citations),
            "average_confidence": avg_confidence,
            "cited_documents": list(set(c.get("document_name") for c in citations if c.get("document_name"))),
            "cited_chunks": [c.get("chunk_id") for c in citations if c.get("chunk_id")],
            "created_at": datetime.utcnow()
        }
        await CitationAnalyticsRepository.get_collection().insert_one(doc)
        return doc
