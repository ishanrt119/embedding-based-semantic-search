from typing import List, Dict, Any

def build_context_packages(results: List[Dict[str, Any]], max_chunks: int = 10, max_tokens: int = 4000) -> List[Dict[str, Any]]:
    """
    Selects the top chunks while strictly enforcing max_chunks and max_tokens budgets.
    Formats the output for downstream LLM ingestion and citation.
    """
    selected_contexts = []
    current_tokens = 0
    
    for res in results:
        if len(selected_contexts) >= max_chunks:
            break
            
        # Extract token count natively or fallback to character estimation (1 token ~= 4 chars)
        token_count = res.get("token_count")
        if not token_count:
            token_count = len(res.get("content", "")) // 4
            
        # If adding this chunk exceeds budget, skip it and try a smaller one
        if current_tokens + token_count > max_tokens:
            continue
            
        current_tokens += token_count
        
        # Build clean structured context
        selected_contexts.append({
            "chunk_id": res.get("chunk_id"),
            "content": res.get("content"),
            "document_id": res.get("document_id"),
            "dataset_id": res.get("dataset_id"),
            "page_number": res.get("page_number"),
            "document_name": res.get("document_name"),
            "retrieval_score": res.get("retrieval_score"),
            "hybrid_score": res.get("hybrid_score"),
            "bm25_score": res.get("bm25_score"),
            "similarity_score": res.get("similarity_score"),
            "token_count": token_count,
            "created_at": res.get("created_at")
        })
        
    return selected_contexts
