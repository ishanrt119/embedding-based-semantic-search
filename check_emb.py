import asyncio
import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'backend'))
from database.mongodb import db_client

async def run():
    await db_client.connect()
    emb = await db_client.db.embeddings.find_one()
    print(emb.keys() if emb else "No embedding")
    if emb:
        print(f"Model: {emb.get('embedding_model', emb.get('model'))}")
        vector = emb.get('vector', emb.get('embedding', []))
        print(f"Vector length: {len(vector)}")

if __name__ == '__main__':
    asyncio.run(run())
