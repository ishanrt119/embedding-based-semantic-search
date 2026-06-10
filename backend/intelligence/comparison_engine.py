import json
from typing import List, Dict, Any
from database.repositories.chunk_repository import ChunkRepository
from database.repositories.document_repository import DocumentRepository
from rag.rag_service import rag_service

class ComparisonEngine:
    @staticmethod
    async def compare_documents(doc_ids: List[str]) -> Dict[str, Any]:
        if len(doc_ids) != 2:
            raise ValueError("Comparison requires exactly two document IDs.")
            
        doc_a_id, doc_b_id = doc_ids
        doc_a = await DocumentRepository.get_document_by_id(doc_a_id)
        doc_b = await DocumentRepository.get_document_by_id(doc_b_id)
        
        name_a = doc_a.get("name", "Document A") if doc_a else "Document A"
        name_b = doc_b.get("name", "Document B") if doc_b else "Document B"
        
        # Fetch up to 10 chunks from each document
        cursor_a = ChunkRepository.get_collection().find({"document_id": doc_a_id}).limit(10)
        chunks_a = await cursor_a.to_list(length=10)
        
        cursor_b = ChunkRepository.get_collection().find({"document_id": doc_b_id}).limit(10)
        chunks_b = await cursor_b.to_list(length=10)
        
        text_a = "\n".join([c.get("content", "") for c in chunks_a])
        text_b = "\n".join([c.get("content", "") for c in chunks_b])
        
        prompt = f"""Compare the following two documents.
Document A ({name_a}):
{text_a}

Document B ({name_b}):
{text_b}

Generate a detailed comparison formatted strictly as a JSON object with the following keys:
- "similarities": list of strings (shared topics or agreements)
- "differences": list of strings (conflicts or unique elements)
- "key_topics": list of strings (main themes across both)
- "summary": string (a comprehensive paragraph summarizing the comparison)

Return ONLY valid JSON. No markdown backticks, no prefixes.
"""

        try:
            raw_ans = await rag_service.generate_answer([{"role": "user", "content": prompt}])
            raw_ans = raw_ans.replace("```json", "").replace("```", "").strip()
            result = json.loads(raw_ans)
            
            # Ensure proper format
            return {
                "similarities": result.get("similarities", []),
                "differences": result.get("differences", []),
                "key_topics": result.get("key_topics", []),
                "summary": result.get("summary", ""),
                "doc_a_name": name_a,
                "doc_b_name": name_b
            }
        except Exception as e:
            return {
                "similarities": [],
                "differences": [],
                "key_topics": [],
                "summary": f"Failed to generate comparison: {str(e)}",
                "doc_a_name": name_a,
                "doc_b_name": name_b
            }

comparison_engine = ComparisonEngine()
