import fitz  # PyMuPDF
from docx import Document as DocxDocument
import csv
import os
from services.logger import logger
from typing import Dict, Any, List

SUPPORTED_TYPES = {"PDF", "DOCX", "TXT", "CSV"}
MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB

def validate_file(file_path: str, original_filename: str, file_type: str) -> bool:
    """Validate file extension and size."""
    if file_type not in SUPPORTED_TYPES:
        raise ValueError(f"Unsupported file type: {file_type}")
    
    if os.path.getsize(file_path) > MAX_FILE_SIZE:
        raise ValueError("File exceeds maximum allowed size of 25 MB")
        
    return True

def extract_text(file_path: str, file_type: str) -> str:
    """Extract text based on file type."""
    extracted_text = ""
    try:
        if file_type == "PDF":
            doc = fitz.open(file_path)
            for page in doc:
                text = page.get_text("text")
                if text.strip():
                    extracted_text += text + "\n"
        elif file_type == "DOCX":
            doc = DocxDocument(file_path)
            for para in doc.paragraphs:
                if para.text.strip():
                    extracted_text += para.text + "\n"
        elif file_type == "TXT":
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                extracted_text = f.read()
        elif file_type == "CSV":
            with open(file_path, newline='', encoding="utf-8", errors="ignore") as csvfile:
                reader = csv.reader(csvfile)
                headers = next(reader, None)
                if headers:
                    for row in reader:
                        for idx, val in enumerate(row):
                            if idx < len(headers):
                                extracted_text += f"{headers[idx]}: {val}\n"
                        extracted_text += "\n"
    except Exception as e:
        logger.error(f"Error extracting text from {file_path}: {str(e)}")
        raise e
        
    return extracted_text

def extract_metadata(file_path: str, file_type: str, extracted_text: str) -> Dict[str, Any]:
    """Calculate and return document metadata."""
    file_size = os.path.getsize(file_path)
    char_count = len(extracted_text)
    word_count = len(extracted_text.split())
    
    page_count = None
    if file_type == "PDF":
        try:
            doc = fitz.open(file_path)
            page_count = len(doc)
        except Exception:
            pass
            
    return {
        "file_size": file_size,
        "total_characters": char_count,
        "word_count": word_count,
        "total_pages": page_count
    }

async def process_document(document_id: str, file_path: str, file_type: str):
    """Main processing pipeline to extract text, generate metadata, and update status."""
    from database.repositories.document_repository import DocumentRepository
    
    try:
        logger.info(f"Starting processing for document: {document_id}")
        await DocumentRepository.update_document(
            document_id=document_id,
            data={"processing_status": "extracting"}
        )
        
        # 1. Extract Text
        extracted_text = extract_text(file_path, file_type)
        if not extracted_text.strip():
            raise ValueError("Extracted text is empty.")
            
        await DocumentRepository.update_document(
            document_id=document_id,
            data={"processing_status": "extracted"}
        )
        
        # 2. Extract Metadata
        metadata = extract_metadata(file_path, file_type, extracted_text)
        
        # 3. Update Status
        await DocumentRepository.update_document(
            document_id=document_id,
            data={
                "processing_status": "indexed", 
                "upload_status": "completed",
                "file_size": metadata["file_size"],
                "total_pages": metadata.get("total_pages"),
                "total_characters": metadata["total_characters"],
            }
        )
        logger.info(f"Processing completed for document: {document_id}")
        
    except Exception as e:
        logger.error(f"Processing failed for document {document_id}: {str(e)}")
        await DocumentRepository.update_document(
            document_id=document_id,
            data={
                "processing_status": "pending",
                "upload_status": "failed"
            }
        )
