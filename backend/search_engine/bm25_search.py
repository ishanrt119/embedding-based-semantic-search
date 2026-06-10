import os
import pickle
import time
from rank_bm25 import BM25Okapi
from typing import List, Dict, Any, Optional
from database.repositories.document_repository import DocumentRepository
from database.repositories.chunk_repository import ChunkRepository

BM25_STORAGE_DIR = "storage/bm25"
os.makedirs(BM25_STORAGE_DIR, exist_ok=True)

class BM25IndexManager:
    def __init__(self):
        # Cache for loaded BM25Okapi instances. Key: user_id
        self.indices = {}
        # Cache for chunk mapping. Key: user_id -> List of chunk_ids corresponding to corpus index
        self.chunk_maps = {}

    def _get_index_path(self, user_id: str) -> str:
        return os.path.join(BM25_STORAGE_DIR, f"{user_id}.pkl")

    def _get_map_path(self, user_id: str) -> str:
        return os.path.join(BM25_STORAGE_DIR, f"{user_id}_map.pkl")

    def load_index(self, user_id: str) -> bool:
        """Loads index and map from disk if available."""
        if user_id in self.indices and user_id in self.chunk_maps:
            return True
            
        index_path = self._get_index_path(user_id)
        map_path = self._get_map_path(user_id)
        
        if os.path.exists(index_path) and os.path.exists(map_path):
            with open(index_path, "rb") as f:
                self.indices[user_id] = pickle.load(f)
            with open(map_path, "rb") as f:
                self.chunk_maps[user_id] = pickle.load(f)
            return True
        return False

    async def sync_user_index(self, user_id: str):
        """Fetches all chunks for a user and rebuilds the BM25 index."""
        cursor = DocumentRepository.get_collection().find({"user_id": user_id})
        user_docs = await cursor.to_list(length=None)
        
        corpus = []
        chunk_map = []
        
        for doc in user_docs:
            doc_id = doc.get("id")
            doc_name = doc.get("original_filename", doc.get("filename", ""))
            dataset_id = doc.get("dataset_id", "")
            
            chunks = await ChunkRepository.get_all_chunks_by_document(doc_id)
            for chunk in chunks:
                chunk_id = chunk.get("id")
                content = chunk.get("content", "")
                
                # Combine metadata and content for rich keyword matching
                text = f"{doc_name} {dataset_id} {content}"
                tokenized_text = text.lower().split(" ")
                
                corpus.append(tokenized_text)
                chunk_map.append(chunk_id)
                
        if not corpus:
            # If no chunks, clear existing index
            if user_id in self.indices:
                del self.indices[user_id]
                del self.chunk_maps[user_id]
            if os.path.exists(self._get_index_path(user_id)):
                os.remove(self._get_index_path(user_id))
            if os.path.exists(self._get_map_path(user_id)):
                os.remove(self._get_map_path(user_id))
            return
            
        # Build BM25 index
        bm25 = BM25Okapi(corpus)
        
        # Cache
        self.indices[user_id] = bm25
        self.chunk_maps[user_id] = chunk_map
        
        # Persist
        with open(self._get_index_path(user_id), "wb") as f:
            pickle.dump(bm25, f)
        with open(self._get_map_path(user_id), "wb") as f:
            pickle.dump(chunk_map, f)

    async def search(self, query: str, user_id: str, top_k: int = 20, dataset_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Searches the BM25 index."""
        if not self.load_index(user_id):
            return []
            
        bm25 = self.indices.get(user_id)
        chunk_map = self.chunk_maps.get(user_id)
        
        if not bm25 or not chunk_map:
            return []
            
        tokenized_query = query.lower().split(" ")
        doc_scores = bm25.get_scores(tokenized_query)
        
        # Map scores to chunk IDs
        results = []
        for i, score in enumerate(doc_scores):
            if score > 0:
                results.append({"chunk_id": chunk_map[i], "bm25_score": float(score)})
                
        # Sort by BM25 score
        results = sorted(results, key=lambda x: x["bm25_score"], reverse=True)
        
        formatted_results = []
        for res in results:
            chunk_id = res["chunk_id"]
            
            chunk_metadata = await ChunkRepository.get_chunk_by_id(chunk_id)
            if not chunk_metadata:
                continue
                
            document_id = chunk_metadata.get("document_id")
            if not document_id:
                continue
                
            doc_metadata = await DocumentRepository.get_document_by_id(document_id)
            if not doc_metadata or doc_metadata.get("user_id") != user_id:
                continue
                
            doc_dataset_id = doc_metadata.get("id")
            
            if dataset_id and dataset_id != "all" and document_id != dataset_id:
                continue
                
            chunk_text = chunk_metadata.get("content", "")
            chunk_preview = chunk_text[:200] + "..." if len(chunk_text) > 200 else chunk_text
            
            formatted_results.append({
                "chunk_id": chunk_id,
                "chunk_preview": chunk_preview,
                "content": chunk_text,
                "document_id": document_id,
                "dataset_id": doc_dataset_id,
                "page_number": chunk_metadata.get("page_number"),
                "bm25_score": res["bm25_score"],
                "created_at": chunk_metadata.get("created_at"),
                "document_name": doc_metadata.get("original_filename", doc_metadata.get("filename", "Unknown Document"))
            })
            
            if len(formatted_results) >= top_k:
                break
                
        return formatted_results

bm25_index_manager = BM25IndexManager()

async def bm25_search(query: str, user_id: str, top_k: int = 20, dataset_id: Optional[str] = None) -> List[Dict[str, Any]]:
    return await bm25_index_manager.search(query, user_id, top_k, dataset_id)
