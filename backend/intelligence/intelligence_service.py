from typing import List, Dict, Any, Optional
from .comparison_engine import comparison_engine
from .contradiction_detector import contradiction_detector
from .synthesis_engine import synthesis_engine
from .report_generator import report_generator

class IntelligenceService:
    @staticmethod
    async def compare(doc_ids: List[str], user_id: str) -> Dict[str, Any]:
        res = await comparison_engine.compare_documents(doc_ids)
        return res

    @staticmethod
    async def find_contradictions(topic: str, doc_ids: List[str], user_id: str) -> Dict[str, Any]:
        res = await contradiction_detector.find_contradictions(topic, doc_ids, user_id)
        return res

    @staticmethod
    async def synthesize(query: str, doc_ids: List[str], user_id: str) -> Dict[str, Any]:
        res = await synthesis_engine.synthesize_knowledge(query, doc_ids, user_id)
        return res

    @staticmethod
    async def generate_report(report_type: str, doc_ids: List[str], user_id: str, topic: Optional[str] = None) -> str:
        markdown = await report_generator.generate_markdown_report(report_type, doc_ids, user_id, topic)
        return markdown

intelligence_service = IntelligenceService()
