from database.mongodb import db_client
from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid

class ChunkRepository:
    @staticmethod
    def get_collection():
        return db_client.db.chunks

    @staticmethod
    async def create_chunk(chunk_data: Dict[str, Any]) -> Dict[str, Any]:
        if "id" not in chunk_data:
            chunk_data["id"] = str(uuid.uuid4())
        chunk_data["created_at"] = datetime.utcnow()
        await ChunkRepository.get_collection().insert_one(chunk_data)
        return chunk_data
        
    @staticmethod
    async def create_chunks(chunks_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        if not chunks_data:
            return []
            
        for chunk in chunks_data:
            if "id" not in chunk:
                chunk["id"] = str(uuid.uuid4())
            chunk["created_at"] = datetime.utcnow()
            
        await ChunkRepository.get_collection().insert_many(chunks_data)
        return chunks_data

    @staticmethod
    async def count_chunks_by_document(document_id: str, search: Optional[str] = None) -> int:
        query = {"document_id": document_id}
        if search:
            or_conditions = [
                {"content": {"$regex": search, "$options": "i"}},
                {"id": search}
            ]
            if search.isdigit():
                or_conditions.append({"page_number": int(search)})
            query["$or"] = or_conditions
        return await ChunkRepository.get_collection().count_documents(query)

    @staticmethod
    async def get_chunks_by_document(document_id: str, skip: int = 0, limit: int = 10, search: Optional[str] = None) -> List[Dict[str, Any]]:
        query = {"document_id": document_id}
        if search:
            or_conditions = [
                {"content": {"$regex": search, "$options": "i"}},
                {"id": search}
            ]
            if search.isdigit():
                or_conditions.append({"page_number": int(search)})
            query["$or"] = or_conditions
        cursor = ChunkRepository.get_collection().find(query).sort("chunk_index", 1).skip(skip).limit(limit)
        return await cursor.to_list(length=limit)

    @staticmethod
    async def get_chunk_by_id(chunk_id: str) -> Optional[Dict[str, Any]]:
        return await ChunkRepository.get_collection().find_one({"id": chunk_id})
        
    @staticmethod
    async def get_all_chunks_by_document(document_id: str) -> List[Dict[str, Any]]:
        cursor = ChunkRepository.get_collection().find({"document_id": document_id}).sort("chunk_index", 1)
        return await cursor.to_list(length=None)

    @staticmethod
    async def delete_chunks_by_document(document_id: str) -> None:
        await ChunkRepository.get_collection().delete_many({"document_id": document_id})
