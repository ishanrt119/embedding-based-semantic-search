from .faiss_store import FaissStore
from .persistence import IndexPersistenceManager
from database.repositories.vector_index_repository import VectorIndexRepository
from typing import List, Dict, Any

class VectorIndexManager:
    def __init__(self):
        self.store = FaissStore()
        self.persistence = IndexPersistenceManager(self.store)

    def restore_indexes(self):
        self.persistence.restore_all_indexes()

    def get_stats(self, user_id: str) -> Dict[str, Any]:
        stats = self.store.get_index_stats(user_id)
        disk_size = self.persistence.get_user_index_size(user_id)
        stats["disk_size_bytes"] = disk_size
        return stats

    async def add_embeddings(self, user_id: str, document_id: str, embeddings: List[Dict[str, Any]], dimension: int, index_type: str = "IndexFlatL2"):
        """
        Embeddings is a list of dicts from EmbeddingRepository, containing `vector`, `chunk_id`, `model`.
        """
        if not embeddings:
            return 0
            
        self.store.initialize_index(user_id, dimension, index_type)
        
        vectors = [emb["vector"] for emb in embeddings]
        
        # Add to FAISS
        faiss_ids = self.store.add_vectors(user_id, vectors, metadata=[])
        
        # Save to disk incrementally
        self.persistence.save_user_index(user_id)
        
        # Build metadata for MongoDB
        metadata_records = []
        for i, emb in enumerate(embeddings):
            metadata_records.append({
                "document_id": document_id,
                "chunk_id": str(emb["chunk_id"]),
                "user_id": user_id,
                "faiss_id": faiss_ids[i],
                "embedding_model": emb.get("model", "unknown"),
                "vector_dimension": dimension,
                "index_type": index_type
            })
            
        # Store metadata in Mongo
        await VectorIndexRepository.insert_many(metadata_records)
        return len(faiss_ids)

    async def remove_document_vectors(self, user_id: str, document_id: str):
        # 1. Fetch metadata to get faiss_ids
        metadata = await VectorIndexRepository.get_metadata_by_document(document_id, user_id)
        if not metadata:
            return 0
            
        faiss_ids = [m["faiss_id"] for m in metadata]
        
        # 2. Remove from FAISS
        success = self.store.remove_vectors(user_id, faiss_ids)
        if success:
            self.persistence.save_user_index(user_id)
            
        # 3. Remove from MongoDB
        deleted = await VectorIndexRepository.delete_by_document(document_id, user_id)
        return deleted

    async def search(self, user_id: str, query_vector: Any, top_k: int) -> List[Dict[str, Any]]:
        distances, faiss_ids = self.store.search_vectors(user_id, query_vector, top_k)
        if not faiss_ids:
            return []
            
        # Fetch metadata
        metadata_list = await VectorIndexRepository.get_metadata_by_faiss_ids(user_id, faiss_ids)
        
        results = []
        for i, meta in enumerate(metadata_list):
            if meta:
                raw_dist = float(distances[i])
                meta["raw_distance"] = raw_dist
                meta["similarity_score"] = 1.0 / (1.0 + raw_dist)
                if "_id" in meta:
                    meta["_id"] = str(meta["_id"])
                results.append(meta)
                
        return results

index_manager = VectorIndexManager()
