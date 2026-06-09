from database.mongodb import db_client
from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid

class EmbeddingRepository:
    @staticmethod
    def get_collection():
        return db_client.db.embeddings

    @staticmethod
    async def create_embeddings(embeddings_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        if not embeddings_data:
            return []
            
        for emb in embeddings_data:
            if "id" not in emb:
                emb["id"] = str(uuid.uuid4())
            emb["created_at"] = datetime.utcnow()
            
        await EmbeddingRepository.get_collection().insert_many(embeddings_data)
        return embeddings_data

    @staticmethod
    async def count_embeddings_by_document(document_id: str) -> int:
        return await EmbeddingRepository.get_collection().count_documents({"document_id": document_id})

    @staticmethod
    async def get_embeddings_by_document(document_id: str, skip: int = 0, limit: int = 10) -> List[Dict[str, Any]]:
        cursor = EmbeddingRepository.get_collection().find({"document_id": document_id}).sort("created_at", 1).skip(skip).limit(limit)
        return await cursor.to_list(length=limit)

    @staticmethod
    async def delete_embeddings_by_document(document_id: str) -> None:
        await EmbeddingRepository.get_collection().delete_many({"document_id": document_id})
