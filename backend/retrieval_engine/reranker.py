from typing import List, Dict, Any

def rerank_context(results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Applies a secondary ranking layer on top of the base hybrid score.
    Adjusts scores based on chunk length to penalize extremely short, uninformative chunks.
    """
    for res in results:
        base_score = res.get("hybrid_score", 0.0)
        
        if base_score == 0.0 and res.get("similarity_score"):
            base_score = res.get("similarity_score")
            
        content_len = len(res.get("content", ""))
        
        # Length Penalty Heuristics
        length_modifier = 1.0
        if content_len < 50:
            length_modifier = 0.8  # Penalize very short chunks
        elif content_len > 2000:
            length_modifier = 0.95 # Slight penalty for overly verbose chunks
            
        final_score = base_score * length_modifier
        res["retrieval_score"] = final_score
        
    # Sort descending by the newly computed retrieval_score
    results.sort(key=lambda x: x.get("retrieval_score", 0.0), reverse=True)
    
    return results
