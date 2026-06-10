import asyncio
import os
import sys

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.mongodb import db_client
from database.repositories.user_repository import UserRepository
from search_engine.bm25_search import bm25_index_manager

async def build_all():
    await db_client.connect()
    
    users_cursor = UserRepository.get_collection().find({})
    users = await users_cursor.to_list(length=None)
    
    print(f"Found {len(users)} users. Building BM25 indexes...")
    for user in users:
        user_id = str(user.get("id", user.get("_id")))
        print(f"Building for user {user_id}...")
        await bm25_index_manager.sync_user_index(user_id)
        print(f"Built BM25 index for {user_id}")
        
    print("Done building all BM25 indexes.")
    await db_client.disconnect()

if __name__ == "__main__":
    asyncio.run(build_all())
