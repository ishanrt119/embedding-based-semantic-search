import asyncio
import os
import sys
import shutil

sys.path.append(os.path.join(os.getcwd(), 'backend'))
from database.mongodb import db_client
from database.repositories.document_repository import DocumentRepository

async def run():
    await db_client.connect()
    db = db_client.db
    
    # 1. Drop embeddings
    await db.embeddings.delete_many({})
    print("Deleted all embeddings from MongoDB.")
    
    # 2. Drop metadata
    await db.vector_index_metadata.delete_many({})
    print("Deleted all vector index metadata.")
    
    # 3. Delete FAISS indexes
    faiss_dir = os.path.join(os.getcwd(), 'backend', 'storage', 'faiss')
    if os.path.exists(faiss_dir):
        for f in os.listdir(faiss_dir):
            if f.endswith('.index'):
                os.remove(os.path.join(faiss_dir, f))
        print(f"Deleted FAISS index files from {faiss_dir}.")
        
    # 4. Reset document status
    docs = await DocumentRepository.get_collection().find({}).to_list(length=None)
    for doc in docs:
        await DocumentRepository.update_document(doc["id"], {"processing_status": "chunked", "status": "chunked"})
    print(f"Reset {len(docs)} documents to 'chunked' status.")

if __name__ == '__main__':
    asyncio.run(run())
