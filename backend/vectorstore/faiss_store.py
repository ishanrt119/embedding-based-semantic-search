import faiss
import numpy as np
from typing import List, Dict, Any
from vectorstore.base import VectorStore
import os
import pickle

class FAISSStore(VectorStore):
    def __init__(self, dimension: int = 384, index_path: str = "data/faiss_index.bin", metadata_path: str = "data/faiss_meta.pkl"):
        self.dimension = dimension
        self.index_path = index_path
        self.metadata_path = metadata_path
        self.metadata_store = []
        
        os.makedirs(os.path.dirname(index_path), exist_ok=True)
        
        if os.path.exists(index_path):
            self.index = faiss.read_index(index_path)
            if os.path.exists(metadata_path):
                with open(metadata_path, "rb") as f:
                    self.metadata_store = pickle.load(f)
        else:
            self.index = faiss.IndexFlatL2(dimension)
            
    def add_documents(self, embeddings: List[List[float]], metadata: List[Dict[str, Any]]):
        if not embeddings:
            return
            
        vectors = np.array(embeddings).astype('float32')
        self.index.add(vectors)
        self.metadata_store.extend(metadata)
        self._save()
        
    def search(self, query_embedding: List[float], top_k: int = 5) -> List[Dict[str, Any]]:
        if self.index.ntotal == 0:
            return []
            
        vector = np.array([query_embedding]).astype('float32')
        distances, indices = self.index.search(vector, top_k)
        
        results = []
        for i, idx in enumerate(indices[0]):
            if idx != -1 and idx < len(self.metadata_store):
                meta = self.metadata_store[idx].copy()
                meta["score"] = float(distances[0][i])
                results.append(meta)
                
        return results
        
    def delete_documents(self, dataset_id: str):
        # FAISS doesn't support easy deletion in IndexFlatL2
        # In a production system, use ChromaDB or FAISS IndexIDMap
        pass
        
    def _save(self):
        faiss.write_index(self.index, self.index_path)
        with open(self.metadata_path, "wb") as f:
            pickle.dump(self.metadata_store, f)

# Global singleton for basic usage
faiss_store = FAISSStore()
