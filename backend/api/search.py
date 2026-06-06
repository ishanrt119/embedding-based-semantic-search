from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Dict, Any
from vectorstore.faiss_store import faiss_store
from embeddings.generator import generate_embedding
from rank_bm25 import BM25Okapi

router = APIRouter()

class SearchQuery(BaseModel):
    query: str
    top_k: int = 5
    search_type: str = "hybrid" # 'semantic', 'keyword', 'hybrid'

@router.post("/")
async def search(query: SearchQuery):
    # For now, we mock the entire dataset fetching for BM25.
    # In production, this would query all documents in the user's dataset or use ElasticSearch/Typesense
    
    # 1. Semantic Search (Vector)
    query_emb = generate_embedding(query.query)
    semantic_results = faiss_store.search(query_emb, top_k=query.top_k)
    
    if query.search_type == "semantic":
        return {"results": semantic_results, "type": "semantic"}
        
    # 2. Keyword Search (BM25) Mock
    # We build a BM25 index on the fly from semantic results for demonstration purposes
    # In a real app, you would retrieve all documents and index them, or use a proper inverted index.
    documents = [res["content"] for res in semantic_results] if semantic_results else []
    tokenized_corpus = [doc.split(" ") for doc in documents]
    
    if not tokenized_corpus:
        return {"results": [], "type": query.search_type}
        
    bm25 = BM25Okapi(tokenized_corpus)
    tokenized_query = query.query.split(" ")
    doc_scores = bm25.get_scores(tokenized_query)
    
    # 3. Hybrid Search
    hybrid_results = []
    for i, res in enumerate(semantic_results):
        bm25_score = doc_scores[i]
        vector_score = res["score"] # L2 distance, lower is better. Assuming normalized.
        
        # This is a naive formula. In reality, you'd normalize both scores first.
        # For simplicity:
        final_score = (0.3 * bm25_score) + (0.7 * (1.0 / (1.0 + vector_score)))
        
        res_copy = res.copy()
        res_copy["hybrid_score"] = final_score
        res_copy["keyword_score"] = bm25_score
        hybrid_results.append(res_copy)
        
    hybrid_results = sorted(hybrid_results, key=lambda x: x["hybrid_score"], reverse=True)
    
    if query.search_type == "keyword":
        # Sort just by keyword
        keyword_results = sorted(hybrid_results, key=lambda x: x["keyword_score"], reverse=True)
        return {"results": keyword_results, "type": "keyword"}
        
    return {"results": hybrid_results, "type": "hybrid"}
