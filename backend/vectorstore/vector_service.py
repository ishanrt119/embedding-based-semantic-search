import asyncio
from database.repositories.document_repository import DocumentRepository
from database.repositories.embedding_repository import EmbeddingRepository
from .index_manager import index_manager
from services.logger import logger

class VectorService:
    @staticmethod
    async def process_document_indexing(document_id: str, user_id: str, index_type: str = "IndexFlatL2"):
        try:
            # 1. Verify document
            document = await DocumentRepository.get_document_by_id(document_id)
            if not document or document.get("user_id") != user_id:
                logger.error(f"Document {document_id} not found for user {user_id}")
                return
            
            # Update status
            await DocumentRepository.update_document(document_id, {"status": "indexing"})
            
            # 2. Get embeddings
            # We assume a document comfortably fits in memory for this MVP (up to 100k vectors)
            embeddings = await EmbeddingRepository.get_embeddings_by_document(document_id, skip=0, limit=100000)
            if not embeddings:
                logger.warning(f"No embeddings found for document {document_id}")
                await DocumentRepository.update_document(document_id, {"status": "failed"})
                return

            dimension = len(embeddings[0]["vector"])

            # 3. Add to index
            indexed_count = await index_manager.add_embeddings(
                user_id=user_id,
                document_id=document_id,
                embeddings=embeddings,
                dimension=dimension,
                index_type=index_type
            )
            
            logger.info(f"Successfully indexed {indexed_count} vectors for document {document_id}")
            
            # Update status
            await DocumentRepository.update_document(document_id, {"status": "indexed"})
            
        except Exception as e:
            logger.error(f"Error during indexing document {document_id}: {e}")
            await DocumentRepository.update_document(document_id, {"status": "failed"})

    @staticmethod
    async def reindex_document(document_id: str, user_id: str, index_type: str = "IndexFlatL2"):
        await index_manager.remove_document_vectors(user_id, document_id)
        await VectorService.process_document_indexing(document_id, user_id, index_type)
