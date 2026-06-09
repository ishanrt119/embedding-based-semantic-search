from database.mongodb import db_client
from typing import Dict, Any
from datetime import datetime
import uuid

class AnalyticsRepository:
    @staticmethod
    def get_collection():
        return db_client.db.analytics

    @staticmethod
    async def log_metric(user_id: str, metric_name: str, metric_value: Any) -> Dict[str, Any]:
        analytics_doc = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "metric_name": metric_name,
            "metric_value": metric_value,
            "created_at": datetime.utcnow()
        }
        await AnalyticsRepository.get_collection().insert_one(analytics_doc)
        return analytics_doc
