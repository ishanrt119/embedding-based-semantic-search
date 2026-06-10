import re
from typing import List, Dict, Any, Tuple

FALLBACK_PHRASE = "I could not find that information in the uploaded documents."

def validate_and_extract_citations(answer: str, retrieved_contexts: List[Dict[str, Any]]) -> Tuple[str, List[Dict[str, Any]]]:
    """
    Parses the generated LLM text for [Source X] markers.
    If no markers exist and the answer isn't the fallback, forces the fallback phrase.
    Returns the validated answer and the list of actual cited sources.
    """
    if FALLBACK_PHRASE.lower() in answer.lower():
        return FALLBACK_PHRASE, []
        
    source_pattern = r'\[Source\s+(\d+)\]'
    matches = re.findall(source_pattern, answer, flags=re.IGNORECASE)
    
    if not matches:
        # Strict Grounding Rule: If LLM didn't cite anything, we consider it a hallucination.
        return FALLBACK_PHRASE, []
        
    # Extract cited context indices (1-based to 0-based)
    cited_indices = set()
    for m in matches:
        try:
            idx = int(m) - 1
            if 0 <= idx < len(retrieved_contexts):
                cited_indices.add(idx)
        except ValueError:
            pass
            
    final_citations = []
    for idx in sorted(list(cited_indices)):
        ctx = retrieved_contexts[idx]
        final_citations.append({
            "document_name": ctx.get("document_name"),
            "page_number": ctx.get("page_number"),
            "chunk_id": ctx.get("chunk_id"),
            "dataset_id": ctx.get("dataset_id"),
            "content": ctx.get("content")
        })
        
    return answer, final_citations
