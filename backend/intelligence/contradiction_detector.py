import json
from typing import List, Dict, Any
from retrieval_engine.retrieval_service import retrieval_service
from rag.rag_service import rag_service
from database.repositories.document_repository import DocumentRepository

class ContradictionDetector:
    @staticmethod
    async def find_contradictions(topic: str, doc_ids: List[str], user_id: str) -> Dict[str, Any]:
        all_contexts = []
        doc_names = {}
        
        # Retrieve chunks for the topic from each document
        for doc_id in doc_ids:
            doc = await DocumentRepository.get_document_by_id(doc_id)
            if doc:
                doc_names[doc_id] = doc.get("name", "Unknown Document")
                
            res = await retrieval_service.get_context(
                query=topic,
                user_id=user_id,
                top_k=5,
                max_tokens=2000,
                dataset_id=doc_id
            )
            all_contexts.extend(res.get("contexts", []))
            
        context_str = ""
        for idx, ctx in enumerate(all_contexts):
            context_str += f"[Source {idx+1}] Document: {ctx.get('document_name', 'Unknown')}\n{ctx.get('content')}\n\n"
            
        prompt = f"""You are a strict Contradiction Detector.
Analyze the following document excerpts regarding the topic: "{topic}".
Look for conflicting dates, numbers, policies, or statements between the different documents.

CONTEXT:
{context_str}

Return a strictly formatted JSON array of contradiction objects.
If there are no contradictions, return an empty array: []

Example of one contradiction object:
{{
    "description": "Policy A says X, but Policy B says Y.",
    "sources": ["Source 1", "Source 3"]
}}

Return ONLY valid JSON. No markdown backticks.
"""
        
        try:
            raw_ans = await rag_service.generate_answer([{"role": "user", "content": prompt}])
            raw_ans = raw_ans.replace("```json", "").replace("```", "").strip()
            result = json.loads(raw_ans)
            if not isinstance(result, list):
                result = []
                
            return {
                "topic": topic,
                "contradictions": result,
                "analyzed_documents": list(doc_names.values()),
                "contexts": all_contexts
            }
        except Exception as e:
            return {
                "topic": topic,
                "contradictions": [],
                "error": str(e),
                "analyzed_documents": list(doc_names.values()),
                "contexts": all_contexts
            }

contradiction_detector = ContradictionDetector()
