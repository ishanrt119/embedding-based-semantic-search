import re
import difflib
from typing import List, Dict, Any, Tuple

FALLBACK_PHRASE = "I could not find that information in the uploaded documents."

def extract_evidence(answer: str, chunk_text: str) -> str:
    matcher = difflib.SequenceMatcher(None, answer.lower(), chunk_text.lower())
    match = matcher.find_longest_match(0, len(answer), 0, len(chunk_text))
    
    if match.size > 15:
        return chunk_text[match.b:match.b + match.size]
        
    answer_words = set(answer.lower().split())
    best_sentence = ""
    max_overlap = 0
    sentences = re.split(r'(?<=[.!?])\s+', chunk_text)
    for s in sentences:
        s_words = set(s.lower().split())
        overlap = len(answer_words.intersection(s_words))
        if overlap > max_overlap:
            max_overlap = overlap
            best_sentence = s
            
    if max_overlap > 3:
        return best_sentence
        
    return ""

def calculate_confidence(ctx: Dict[str, Any]) -> float:
    sim = ctx.get("similarity_score", 0)
    if sim > 0:
        return min(round(sim * 100, 1), 99.9)
        
    retrieval = ctx.get("retrieval_score", 0)
    if retrieval > 0:
        val = min((retrieval / 0.033) * 100, 99.9)
        return round(val, 1)
        
    return 50.0

def validate_and_extract_citations(answer: str, retrieved_contexts: List[Dict[str, Any]]) -> Tuple[str, List[Dict[str, Any]]]:
    if FALLBACK_PHRASE.lower() in answer.lower():
        return FALLBACK_PHRASE, []
        
    source_pattern = r'\[Source\s+(\d+)\]'
    matches = re.findall(source_pattern, answer, flags=re.IGNORECASE)
    
    if not matches:
        return FALLBACK_PHRASE, []
        
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
            "content": ctx.get("content"),
            "retrieval_score": ctx.get("retrieval_score"),
            "confidence": calculate_confidence(ctx),
            "evidence_highlight": extract_evidence(answer, ctx.get("content", ""))
        })
        
    return answer, final_citations
