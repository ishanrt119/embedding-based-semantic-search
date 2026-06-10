import difflib
from typing import List, Dict, Any

def deduplicate_chunks(results: List[Dict[str, Any]], threshold: float = 0.9) -> List[Dict[str, Any]]:
    """
    Removes near-duplicate chunks based on text similarity.
    Assumes the input results list is pre-sorted by score (highest first).
    """
    unique_results = []
    
    for res in results:
        is_duplicate = False
        text_a = res.get("content", "")
        
        # Fast string match against already selected unique chunks
        for u_res in unique_results:
            text_b = u_res.get("content", "")
            
            # Using difflib for rapid text similarity calculation
            similarity = difflib.SequenceMatcher(None, text_a, text_b).ratio()
            
            if similarity >= threshold:
                is_duplicate = True
                break
                
        if not is_duplicate:
            unique_results.append(res)
            
    return unique_results
