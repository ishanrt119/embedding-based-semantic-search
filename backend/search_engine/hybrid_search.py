from typing import List, Dict, Any, Optional
from .semantic_search import semantic_search
from .bm25_search import bm25_search
from .score_fusion import reciprocal_rank_fusion
from .reranker import rerank

async def hybrid_search(query: str, user_id: str, top_k: int = 10, dataset_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Executes a Hybrid Search combining Semantic (FAISS) and Keyword (BM25) results.
    """
    # 1. Fetch top 20 for each strategy to allow good fusion
    search_k = max(20, top_k * 2)
    
    # Execute searches sequentially (can be optimized with asyncio.gather if models allow)
    semantic_results = await semantic_search(query, user_id, top_k=search_k, dataset_id=dataset_id)
    keyword_results = await bm25_search(query, user_id, top_k=search_k, dataset_id=dataset_id)
    
    # 2. Prepare merged dictionary for reranking metadata
    all_results_dict = {}
    
    for res in semantic_results:
        chunk_id = res["chunk_id"]
        all_results_dict[chunk_id] = res.copy()
        all_results_dict[chunk_id]["similarity_score"] = res.get("similarity_score", 0.0)
        all_results_dict[chunk_id]["bm25_score"] = 0.0
        
    for res in keyword_results:
        chunk_id = res["chunk_id"]
        if chunk_id not in all_results_dict:
            all_results_dict[chunk_id] = res.copy()
            all_results_dict[chunk_id]["similarity_score"] = 0.0
        all_results_dict[chunk_id]["bm25_score"] = res.get("bm25_score", 0.0)
        
    # 3. Fuse scores via RRF
    fused_scores = reciprocal_rank_fusion([semantic_results, keyword_results], k=60)
    
    # 4. Rerank and return Top K
    final_results = rerank(fused_scores, all_results_dict, top_k=top_k)
    
    return final_results
