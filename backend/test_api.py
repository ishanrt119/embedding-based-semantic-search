import asyncio
import os
import sys

sys.path.append(os.getcwd())
from api.search import semantic_search, SemanticSearchQuery
from database.mongodb import db_client

async def run():
    await db_client.connect()
    
    # Using the user_id that we found previously
    user_id = "f0657f87-b4b0-4a5e-8e65-f2357d5c0c3d"
    
    query = SemanticSearchQuery(query="Vicharanashala", dataset_id="all")
    
    try:
        from vectorstore.index_manager import index_manager
        index_manager.restore_indexes()
        
        await semantic_search(query=query, user_id=user_id)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    asyncio.run(run())
