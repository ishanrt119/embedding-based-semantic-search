from database.mongodb import db_client
from datetime import datetime

class UsageRepository:
    @staticmethod
    def get_collection():
        return db_client.db.usage_stats

    @staticmethod
    async def increment_search(user_id: str):
        await UsageRepository.get_collection().update_one(
            {"user_id": user_id},
            {"$inc": {"search_queries": 1}, "$setOnInsert": {"reports_generated": 0, "created_at": datetime.utcnow()}},
            upsert=True
        )

    @staticmethod
    async def increment_report(user_id: str):
        await UsageRepository.get_collection().update_one(
            {"user_id": user_id},
            {"$inc": {"reports_generated": 1}, "$setOnInsert": {"search_queries": 0, "created_at": datetime.utcnow()}},
            upsert=True
        )

    @staticmethod
    async def get_user_stats(user_id: str):
        stats = await UsageRepository.get_collection().find_one({"user_id": user_id})
        if not stats:
            return {"search_queries": 0, "reports_generated": 0}
        return {"search_queries": stats.get("search_queries", 0), "reports_generated": stats.get("reports_generated", 0)}
