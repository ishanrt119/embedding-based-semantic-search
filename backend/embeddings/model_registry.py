from typing import Dict
from .base import BaseEmbeddingModel
from .sentence_transformer import SentenceTransformerModel

class ModelRegistry:
    _models: Dict[str, BaseEmbeddingModel] = {}

    @classmethod
    def get_model(cls, model_name: str) -> BaseEmbeddingModel:
        if model_name not in cls._models:
            if model_name == "sentence-transformers/all-MiniLM-L6-v2":
                cls._models[model_name] = SentenceTransformerModel(model_name, dimension=384)
            elif model_name == "BAAI/bge-small-en-v1.5":
                cls._models[model_name] = SentenceTransformerModel(model_name, dimension=384)
            else:
                raise ValueError(f"Unsupported embedding model: {model_name}")
                
        return cls._models[model_name]

    @classmethod
    def get_supported_models(cls) -> list[str]:
        return [
            "sentence-transformers/all-MiniLM-L6-v2",
            "BAAI/bge-small-en-v1.5"
        ]
