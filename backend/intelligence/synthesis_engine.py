from typing import List, Dict, Any
from retrieval_engine.retrieval_service import retrieval_service
from rag.rag_service import rag_service
from rag.answer_validator import validate_and_extract_citations

class SynthesisEngine:
    @staticmethod
    async def synthesize_knowledge(query: str, doc_ids: List[str], user_id: str) -> Dict[str, Any]:
        all_contexts = []
        
        for doc_id in doc_ids:
            res = await retrieval_service.get_context(
                query=query,
                user_id=user_id,
                top_k=3,
                max_tokens=1000,
                dataset_id=doc_id
            )
            all_contexts.extend(res.get("contexts", []))
            
        # Re-sort combined contexts by retrieval score (lowest RRF/highest Similarity is best)
        # Note: Similarity is higher-is-better, RRF is lower-is-better. 
        # For simplicity, we just take the top 15 contexts from the pool to avoid blowing context limits.
        all_contexts = all_contexts[:15]
        
        context_str = ""
        for idx, ctx in enumerate(all_contexts):
            doc_name = ctx.get("document_name", "Unknown")
            page = ctx.get("page_number", "?")
            context_str += f"\n--- Source {idx+1} ---\nDocument: {doc_name} (Page {page})\n{ctx.get('content')}\n"
            
        prompt = f"""Synthesize knowledge from the provided multiple documents to answer the query.

QUERY: {query}

CONTEXT:
{context_str}

RULES:
1. You MUST answer using ONLY the facts provided.
2. You MUST cite your sources using [Source X] inline.
3. If documents disagree, state the disagreement clearly.
4. Format using clear Markdown (headings, bullet points if necessary).
"""

        try:
            raw_ans = await rag_service.generate_answer([{"role": "user", "content": prompt}])
            validated_answer, citations = validate_and_extract_citations(raw_ans, all_contexts)
            
            return {
                "answer": validated_answer,
                "citations": citations,
                "sources_used": len(citations)
            }
        except Exception as e:
            return {
                "answer": f"Synthesis failed: {str(e)}",
                "citations": [],
                "sources_used": 0
            }

synthesis_engine = SynthesisEngine()
