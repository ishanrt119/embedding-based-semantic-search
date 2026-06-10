from typing import List, Dict, Any

def reciprocal_rank_fusion(results_lists: List[List[Dict[str, Any]]], k: int = 60) -> Dict[str, float]:
    """
    Computes Reciprocal Rank Fusion (RRF) scores for multiple lists of search results.
    
    Args:
        results_lists: A list containing lists of result dicts. 
                       Each result dict must have a 'chunk_id'.
        k: The RRF constant (default 60 is an industry standard).
        
    Returns:
        A dictionary mapping chunk_id to its computed RRF score.
    """
    rrf_scores = {}
    
    for results in results_lists:
        for rank, result in enumerate(results):
            chunk_id = result.get("chunk_id")
            if not chunk_id:
                continue
                
            if chunk_id not in rrf_scores:
                rrf_scores[chunk_id] = 0.0
                
            rrf_scores[chunk_id] += 1.0 / (k + rank + 1)
            
    return rrf_scores
