import faiss
import numpy as np
import os
import threading
from typing import List, Dict, Any, Tuple
from .base import VectorStore
from services.logger import logger

class FaissStore(VectorStore):
    def __init__(self):
        # A dictionary mapping user_id -> faiss.IndexIDMap
        self.indexes: Dict[str, faiss.Index] = {}
        # Locks to prevent concurrent modifications to the same user's index
        self.locks: Dict[str, threading.Lock] = {}
        # Keep track of the maximum assigned integer ID per user to prevent overlaps after deletions
        self.id_counters: Dict[str, int] = {}
        
    def _get_lock(self, user_id: str) -> threading.Lock:
        if user_id not in self.locks:
            self.locks[user_id] = threading.Lock()
        return self.locks[user_id]

    def initialize_index(self, user_id: str, dimension: int, index_type: str = "IndexFlatL2"):
        with self._get_lock(user_id):
            if user_id in self.indexes:
                return # Already initialized
                
            if index_type == "IndexFlatL2":
                base_index = faiss.IndexFlatL2(dimension)
            elif index_type == "IndexFlatIP":
                base_index = faiss.IndexFlatIP(dimension)
            else:
                base_index = faiss.IndexFlatL2(dimension)
                
            # Wrap with IndexIDMap to support custom IDs
            self.indexes[user_id] = faiss.IndexIDMap(base_index)
            self.id_counters[user_id] = 0
            logger.info(f"Initialized new FAISS index ({index_type}) for user {user_id}")

    def add_vectors(self, user_id: str, vectors: Any, metadata: List[Dict[str, Any]]) -> List[int]:
        if user_id not in self.indexes:
            raise ValueError(f"Index not initialized for user {user_id}")
            
        with self._get_lock(user_id):
            index = self.indexes[user_id]
            np_vectors = np.array(vectors).astype('float32')
            
            # Generate monotonic IDs
            start_id = self.id_counters.get(user_id, 0)
            count = len(vectors)
            ids = np.array([start_id + i for i in range(count)], dtype=np.int64)
            
            # Add to index
            index.add_with_ids(np_vectors, ids)
            
            # Update counter
            self.id_counters[user_id] = start_id + count
            
            return ids.tolist()

    def remove_vectors(self, user_id: str, ids: List[int]) -> bool:
        if user_id not in self.indexes:
            return False
            
        with self._get_lock(user_id):
            index = self.indexes[user_id]
            id_array = np.array(ids, dtype=np.int64)
            index.remove_ids(id_array)
            return True

    def search_vectors(self, user_id: str, query_vector: Any, top_k: int) -> Tuple[Any, Any]:
        if user_id not in self.indexes:
            return [], []
            
        index = self.indexes[user_id]
        if index.ntotal == 0:
            return [], []
            
        np_query = np.array([query_vector]).astype('float32')
        # In FAISS, search returns distances and indices
        distances, indices = index.search(np_query, top_k)
        return distances[0].tolist(), indices[0].tolist()

    def save_index(self, user_id: str, path: str):
        if user_id not in self.indexes:
            return
            
        with self._get_lock(user_id):
            faiss.write_index(self.indexes[user_id], path)
            # We also need to save the counter. A robust way is to just let the caller handle persistence of counters,
            # or we calculate the max ID when loading.

    def load_index(self, user_id: str, path: str) -> bool:
        if not os.path.exists(path):
            return False
            
        with self._get_lock(user_id):
            try:
                index = faiss.read_index(path)
                self.indexes[user_id] = index
                
                # Reconstruct the counter safely. Faiss IndexIDMap has an `id_map` attribute, but the exact internal structure depends.
                # However, since IDs are strictly increasing, we can look at the max stored ID if it exists.
                # If we can't extract it easily, it's safer to just set counter = ntotal * large_margin, 
                # but it's best to extract it from the id_map.
                try:
                    faiss_id_map = faiss.vector_to_array(index.id_map)
                    if len(faiss_id_map) > 0:
                        self.id_counters[user_id] = int(np.max(faiss_id_map)) + 1
                    else:
                        self.id_counters[user_id] = 0
                except Exception as e:
                    logger.warning(f"Could not extract max ID from FAISS map, defaulting to ntotal + 1000000. {e}")
                    self.id_counters[user_id] = index.ntotal + 1000000

                return True
            except Exception as e:
                logger.error(f"Failed to load FAISS index for user {user_id}: {e}")
                return False

    def get_index_stats(self, user_id: str) -> Dict[str, Any]:
        if user_id not in self.indexes:
            return {"status": "uninitialized"}
            
        index = self.indexes[user_id]
        
        index_type = "Unknown"
        if hasattr(index, 'index'):
            internal = index.index
            if type(internal) == faiss.IndexFlatL2:
                index_type = "IndexFlatL2"
            elif type(internal) == faiss.IndexFlatIP:
                index_type = "IndexFlatIP"
        
        return {
            "status": "ready",
            "vectors_count": index.ntotal,
            "dimension": index.d,
            "metric_type": "L2" if index_type == "IndexFlatL2" else "IP",
            "index_type": index_type
        }

    def delete_index(self, user_id: str):
        with self._get_lock(user_id):
            if user_id in self.indexes:
                del self.indexes[user_id]
            if user_id in self.id_counters:
                del self.id_counters[user_id]
