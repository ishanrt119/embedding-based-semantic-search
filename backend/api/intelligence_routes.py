from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel
from typing import List, Optional
from api.auth import get_current_user
from intelligence.intelligence_service import intelligence_service
from intelligence.report_generator import report_generator

router = APIRouter()

async def get_current_user_id(current_user: dict = Depends(get_current_user)):
    return current_user["id"]

class CompareRequest(BaseModel):
    document_ids: List[str]

class ContradictionRequest(BaseModel):
    topic: str
    document_ids: List[str]

class SynthesisRequest(BaseModel):
    query: str
    document_ids: List[str]

class ReportRequest(BaseModel):
    report_type: str
    document_ids: List[str]
    topic: Optional[str] = None
    export_format: Optional[str] = "markdown"

@router.post("/compare")
async def compare_docs(req: CompareRequest, user_id: str = Depends(get_current_user_id)):
    if len(req.document_ids) != 2:
        raise HTTPException(status_code=400, detail="Must provide exactly two document IDs")
    return await intelligence_service.compare(req.document_ids, user_id)

@router.post("/contradictions")
async def get_contradictions(req: ContradictionRequest, user_id: str = Depends(get_current_user_id)):
    return await intelligence_service.find_contradictions(req.topic, req.document_ids, user_id)

@router.post("/synthesize")
async def synthesize_info(req: SynthesisRequest, user_id: str = Depends(get_current_user_id)):
    return await intelligence_service.synthesize(req.query, req.document_ids, user_id)

@router.post("/report")
async def generate_report(req: ReportRequest, user_id: str = Depends(get_current_user_id)):
    from database.repositories.usage_repository import UsageRepository
    try:
        await UsageRepository.increment_report(user_id)
    except Exception:
        pass

    markdown_content = await intelligence_service.generate_report(req.report_type, req.document_ids, user_id, req.topic)
    
    if req.export_format == "pdf":
        pdf_bytes = report_generator.export_to_pdf(markdown_content)
        return Response(content=pdf_bytes, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=report.pdf"})
    elif req.export_format == "docx":
        docx_bytes = report_generator.export_to_docx(markdown_content)
        return Response(content=docx_bytes, media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document", headers={"Content-Disposition": f"attachment; filename=report.docx"})
        
    return {"markdown": markdown_content}
