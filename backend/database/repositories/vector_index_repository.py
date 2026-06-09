from database.mongodb import db_client
from bson import ObjectId
from datetime import datetime
from typing import List, Dict, Any, Optional

class VectorIndexRepository:
    collection_name = "vector_index_metadata"

    @classmethod
    def get_collection(cls):
        return db_client.db[cls.collection_name]

    @classmethod
    async def insert_many(cls, metadata_list: List[Dict[str, Any]]):
        if not metadata_list:
            return []
        
        for meta in metadata_list:
            meta["indexed_at"] = datetime.utcnow()
            
        result = await cls.get_collection().insert_many(metadata_list)
        return result.inserted_ids

    @classmethod
    async def delete_by_document(cls, document_id: str, user_id: str):
        result = await cls.get_collection().delete_many({
            "document_id": document_id,
            "user_id": user_id
        })
        return result.deleted_count

    @classmethod
    async def delete_by_user(cls, user_id: str):
        result = await cls.get_collection().delete_many({"user_id": user_id})
        return result.deleted_count

    @classmethod
    async def get_metadata_by_faiss_ids(cls, user_id: str, faiss_ids: List[int]) -> List[Dict[str, Any]]:
        cursor = cls.get_collection().find({
            "user_id": user_id,
            "faiss_id": {"$in": faiss_ids}
        })
        results = await cursor.to_list(length=None)
        
        # Order the results to match the order of faiss_ids
        results_map = {r["faiss_id"]: r for r in results}
        ordered_results = [results_map.get(fid) for fid in faiss_ids]
        return [r for r in ordered_results if r is not None]

    @classmethod
    async def get_metadata_by_document(cls, document_id: str, user_id: str) -> List[Dict[str, Any]]:
        cursor = cls.get_collection().find({
            "document_id": document_id,
            "user_id": user_id
        })
        return await cursor.to_list(length=None)

    @classmethod
    async def count_indexed_by_document(cls, document_id: str, user_id: str) -> int:
        return await cls.get_collection().count_documents({
            "document_id": document_id,
            "user_id": user_id
        })
