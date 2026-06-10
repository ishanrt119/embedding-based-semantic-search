import time
from typing import List, Dict, Any, Optional

from search_engine.hybrid_search import hybrid_search
from .deduplicator import deduplicate_chunks
from .reranker import rerank_context
from .context_builder import build_context_packages

class Retriever:
    @staticmethod
    async def retrieve_context(
        query: str, 
        user_id: str, 
        top_k: int = 10, 
        max_tokens: int = 4000,
        dataset_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        The main Retrieval Pipeline.
        1. Base Retrieval (Hybrid Search up to 50 items)
        2. Deduplication
        3. Re-ranking
        4. Context Building and Constraint Enforcement
        """
        start_time = time.time()
        
        # 1. Base Retrieval (Fetch more than needed to allow filtering)
        fetch_k = max(50, top_k * 3)
        raw_results = await hybrid_search(query, user_id, top_k=fetch_k, dataset_id=dataset_id)
        
        if not raw_results:
            return {
                "query": query,
                "contexts": [],
                "latency_ms": 0,
                "stats": {
                    "raw_chunks": 0,
                    "deduplicated_chunks": 0,
                    "total_tokens": 0,
                    "avg_score": 0.0
                }
            }
            
        # 2. Deduplication
        dedup_results = deduplicate_chunks(raw_results, threshold=0.9)
        
        # 3. Re-ranking
        reranked_results = rerank_context(dedup_results)
        
        # 4. Context Building
        final_contexts = build_context_packages(reranked_results, max_chunks=top_k, max_tokens=max_tokens)
        
        latency = (time.time() - start_time) * 1000
        
        # Stats calculation
        total_tokens = sum(c.get("token_count", 0) for c in final_contexts)
        avg_score = sum(c.get("retrieval_score", 0.0) for c in final_contexts) / len(final_contexts) if final_contexts else 0.0
        
        # Async Logging to MongoDB removed
        
        return {
            "query": query,
            "contexts": final_contexts,
            "latency_ms": latency,
            "stats": {
                "raw_chunks": len(raw_results),
                "deduplicated_chunks": len(dedup_results),
                "total_tokens": total_tokens,
                "avg_score": avg_score
            }
        }

retriever = Retriever()
