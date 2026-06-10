import asyncio
import os
import sys
import uuid

sys.path.append(os.path.join(os.getcwd(), 'backend'))
from database.mongodb import db_client
from database.repositories.document_repository import DocumentRepository
from embeddings.embedding_service import generate_embeddings_background
from vectorstore.vector_service import VectorService
from vectorstore.index_manager import index_manager

async def run():
    await db_client.connect()
    
    docs = await DocumentRepository.get_collection().find({}).to_list(length=None)
    for doc in docs:
        doc_id = doc["id"]
        user_id = doc["user_id"]
        
        # We need to initialize the index manager correctly, since it's an async singleton we might need to reset it.
        index_manager.restore_indexes()

        # Step 1: Embeddings
        print(f"Generating embeddings for {doc_id}...")
        job_id = str(uuid.uuid4())
        await generate_embeddings_background(
            job_id=job_id,
            document_id=doc_id,
            user_id=user_id,
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )
        print("Embeddings generated.")
        
        # Step 2: Indexing
        print(f"Indexing {doc_id} into FAISS...")
        await VectorService.process_document_indexing(doc_id, user_id)
        print("Indexing completed.")
        
if __name__ == '__main__':
    asyncio.run(run())
