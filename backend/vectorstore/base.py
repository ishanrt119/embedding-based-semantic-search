from abc import ABC, abstractmethod
from typing import List, Dict, Any

class VectorStore(ABC):
    
    @abstractmethod
    def add_documents(self, embeddings: List[List[float]], metadata: List[Dict[str, Any]]):
        pass
        
    @abstractmethod
    def search(self, query_embedding: List[float], top_k: int = 5) -> List[Dict[str, Any]]:
        pass
        
    @abstractmethod
    def delete_documents(self, dataset_id: str):
        pass
