from abc import ABC, abstractmethod
from typing import List

class BaseEmbeddingModel(ABC):
    @property
    @abstractmethod
    def name(self) -> str:
        pass

    @property
    @abstractmethod
    def dimension(self) -> int:
        pass

    @abstractmethod
    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """Compute embeddings for a batch of texts."""
        pass
