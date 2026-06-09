from typing import List
from sentence_transformers import SentenceTransformer
from services.logger import logger
from .base import BaseEmbeddingModel

class SentenceTransformerModel(BaseEmbeddingModel):
    def __init__(self, model_name: str, dimension: int):
        self.model_name = model_name
        self._dimension = dimension
        logger.info(f"Loading embedding model: {model_name}")
        self.model = SentenceTransformer(model_name)
        
    @property
    def name(self) -> str:
        return self.model_name
        
    @property
    def dimension(self) -> int:
        return self._dimension

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        try:
            embeddings = self.model.encode(texts)
            return embeddings.tolist()
        except Exception as e:
            logger.error(f"Error encoding batch with {self.model_name}: {e}")
            raise e
