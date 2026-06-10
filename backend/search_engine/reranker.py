from typing import List, Dict, Any

def rerank(fused_scores: Dict[str, float], all_results_dict: Dict[str, Dict[str, Any]], top_k: int = 10) -> List[Dict[str, Any]]:
    """
    Reranks the combined results using the RRF fused scores.
    
    Args:
        fused_scores: Dictionary mapping chunk_id to RRF score.
        all_results_dict: Dictionary mapping chunk_id to its full result metadata.
        top_k: Number of top results to return.
        
    Returns:
        A list of top_k result dicts, sorted by 'hybrid_score' descending.
    """
    reranked = []
    
    for chunk_id, rrf_score in fused_scores.items():
        if chunk_id in all_results_dict:
            result_item = all_results_dict[chunk_id].copy()
            result_item["hybrid_score"] = rrf_score
            reranked.append(result_item)
            
    # Sort descending by hybrid_score
    reranked.sort(key=lambda x: x["hybrid_score"], reverse=True)
    
    return reranked[:top_k]
