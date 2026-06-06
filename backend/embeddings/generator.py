from sentence_transformers import SentenceTransformer
from typing import List

# Use the primary recommended model
model = SentenceTransformer('all-MiniLM-L6-v2')

def generate_embeddings(texts: List[str]) -> List[List[float]]:
    """
    Generate vector embeddings for a list of strings.
    """
    embeddings = model.encode(texts)
    return embeddings.tolist()

def generate_embedding(text: str) -> List[float]:
    """
    Generate a vector embedding for a single string.
    """
    embedding = model.encode(text)
    return embedding.tolist()
