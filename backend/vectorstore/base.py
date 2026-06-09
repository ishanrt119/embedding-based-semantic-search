from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional, Tuple

class VectorStore(ABC):
    """
    Abstract base class for all vector store implementations.
    This guarantees that FAISS can be swapped with Qdrant, Milvus, etc., with minimal code changes.
    """
    
    @abstractmethod
    def add_vectors(self, user_id: str, vectors: Any, metadata: List[Dict[str, Any]]) -> List[int]:
        """
        Add vectors incrementally to the user's index.
        Returns a list of integer IDs assigned to the vectors.
        """
        pass

    @abstractmethod
    def remove_vectors(self, user_id: str, ids: List[int]) -> bool:
        """
        Remove vectors by their integer IDs from the user's index.
        """
        pass

    @abstractmethod
    def search_vectors(self, user_id: str, query_vector: Any, top_k: int) -> Tuple[Any, Any]:
        """
        Search for the top_k most similar vectors in the user's index.
        Returns a tuple of (distances, ids).
        """
        pass

    @abstractmethod
    def save_index(self, user_id: str, path: str):
        """
        Persist the user's index to disk.
        """
        pass

    @abstractmethod
    def load_index(self, user_id: str, path: str) -> bool:
        """
        Load the user's index from disk into memory.
        """
        pass

    @abstractmethod
    def get_index_stats(self, user_id: str) -> Dict[str, Any]:
        """
        Retrieve statistics about the user's index (count, dimension, type).
        """
        pass

    @abstractmethod
    def initialize_index(self, user_id: str, dimension: int, index_type: str = "IndexFlatL2"):
        """
        Create a new index for the user.
        """
        pass

    @abstractmethod
    def delete_index(self, user_id: str):
        """
        Completely delete the user's index from memory.
        """
        pass
