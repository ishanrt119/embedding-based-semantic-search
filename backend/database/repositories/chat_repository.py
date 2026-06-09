from database.mongodb import db_client
from typing import Dict, Any, List, Optional
from datetime import datetime
import uuid

class ChatRepository:
    @staticmethod
    def get_collection():
        return db_client.db.chat_sessions

    @staticmethod
    async def create_session(user_id: str) -> Dict[str, Any]:
        session_doc = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "messages": [],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        await ChatRepository.get_collection().insert_one(session_doc)
        return session_doc

    @staticmethod
    async def get_session_by_id(session_id: str) -> Optional[Dict[str, Any]]:
        return await ChatRepository.get_collection().find_one({"id": session_id})

    @staticmethod
    async def get_sessions_by_user(user_id: str, skip: int = 0, limit: int = 20) -> List[Dict[str, Any]]:
        cursor = ChatRepository.get_collection().find({"user_id": user_id}).sort("updated_at", -1).skip(skip).limit(limit)
        return await cursor.to_list(length=limit)

    @staticmethod
    async def add_message(session_id: str, role: str, content: str, sources: List[Dict[str, Any]] = None) -> None:
        message = {
            "role": role,
            "content": content,
            "timestamp": datetime.utcnow()
        }
        if sources:
            message["sources"] = sources
            
        await ChatRepository.get_collection().update_one(
            {"id": session_id},
            {
                "$push": {"messages": message},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
