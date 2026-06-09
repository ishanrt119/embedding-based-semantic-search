from motor.motor_asyncio import AsyncIOMotorClient
import os
from services.logger import logger
from dotenv import load_dotenv

load_dotenv()

class MongoDBClient:
    client: AsyncIOMotorClient = None
    db = None

    async def connect(self):
        try:
            uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
            db_name = os.getenv("DATABASE_NAME", "semantic_search")
            self.client = AsyncIOMotorClient(uri)
            self.db = self.client[db_name]
            logger.info(f"Connected to MongoDB database: {db_name}")
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise e

    async def disconnect(self):
        if self.client:
            self.client.close()
            logger.info("Disconnected from MongoDB")

db_client = MongoDBClient()
