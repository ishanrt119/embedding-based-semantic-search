from database.mongodb import db_client
from typing import Dict, Any, Optional
from datetime import datetime
import uuid

class JobRepository:
    @staticmethod
    def get_collection():
        return db_client.db.embedding_jobs

    @staticmethod
    async def create_job(document_id: str, total_chunks: int, model: str) -> Dict[str, Any]:
        job_data = {
            "id": str(uuid.uuid4()),
            "document_id": document_id,
            "total_chunks": total_chunks,
            "processed_chunks": 0,
            "percentage_complete": 0,
            "current_status": "starting",
            "model": model,
            "processing_time_ms": 0,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        await JobRepository.get_collection().insert_one(job_data)
        return job_data

    @staticmethod
    async def get_job_by_document(document_id: str) -> Optional[Dict[str, Any]]:
        # Get latest job for this document
        return await JobRepository.get_collection().find_one(
            {"document_id": document_id},
            sort=[("created_at", -1)]
        )

    @staticmethod
    async def update_job(job_id: str, data: Dict[str, Any]) -> None:
        data["updated_at"] = datetime.utcnow()
        await JobRepository.get_collection().update_one({"id": job_id}, {"$set": data})

    @staticmethod
    async def delete_jobs_by_document(document_id: str) -> None:
        await JobRepository.get_collection().delete_many({"document_id": document_id})
