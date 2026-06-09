from database.mongodb import db_client
from typing import Optional, Dict, Any
from datetime import datetime
import uuid

class UserRepository:
    @staticmethod
    def get_collection():
        return db_client.db.users

    @staticmethod
    async def create_user(email: str, password_hash: str, first_name: str = "", last_name: str = "") -> Dict[str, Any]:
        user_id = str(uuid.uuid4())
        user_doc = {
            "id": user_id,
            "email": email,
            "first_name": first_name,
            "last_name": last_name,
            "password": password_hash,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        await UserRepository.get_collection().insert_one(user_doc)
        return user_doc

    @staticmethod
    async def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
        return await UserRepository.get_collection().find_one({"email": email})

    @staticmethod
    async def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
        return await UserRepository.get_collection().find_one({"id": user_id})

    @staticmethod
    async def get_first_user() -> Optional[Dict[str, Any]]:
        return await UserRepository.get_collection().find_one()
