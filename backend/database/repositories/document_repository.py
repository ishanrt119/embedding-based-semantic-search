from database.mongodb import db_client
from typing import Optional, Dict, Any, List
from datetime import datetime
import uuid

class DocumentRepository:
    @staticmethod
    def get_collection():
        return db_client.db.documents

    @staticmethod
    async def create_document(document_data: Dict[str, Any]) -> Dict[str, Any]:
        # ensure id exists for backwards compatibility
        if "id" not in document_data:
            document_data["id"] = str(uuid.uuid4())
        
        document_data["created_at"] = datetime.utcnow()
        document_data["updated_at"] = datetime.utcnow()
        
        await DocumentRepository.get_collection().insert_one(document_data)
        return document_data

    @staticmethod
    async def get_documents_by_user(user_id: str, skip: int = 0, limit: int = 10) -> List[Dict[str, Any]]:
        cursor = DocumentRepository.get_collection().find({"user_id": user_id}).sort("created_at", -1).skip(skip).limit(limit)
        return await cursor.to_list(length=limit)

    @staticmethod
    async def count_documents_by_user(user_id: str) -> int:
        return await DocumentRepository.get_collection().count_documents({"user_id": user_id})

    @staticmethod
    async def get_document_by_id(document_id: str) -> Optional[Dict[str, Any]]:
        return await DocumentRepository.get_collection().find_one({"id": document_id})

    @staticmethod
    async def update_document(document_id: str, data: Dict[str, Any]) -> None:
        data["updated_at"] = datetime.utcnow()
        await DocumentRepository.get_collection().update_one({"id": document_id}, {"$set": data})

    @staticmethod
    async def delete_document(document_id: str) -> None:
        await DocumentRepository.get_collection().delete_one({"id": document_id})
