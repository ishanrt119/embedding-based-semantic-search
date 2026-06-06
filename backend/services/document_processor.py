import fitz  # PyMuPDF
from langchain.text_splitter import RecursiveCharacterTextSplitter, CharacterTextSplitter
from typing import List, Dict

def extract_text_from_pdf(file_path: str) -> List[Dict]:
    doc = fitz.open(file_path)
    pages = []
    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        text = page.get_text("text")
        if text.strip():
            pages.append({
                "page_num": page_num + 1,
                "content": text
            })
    return pages

def chunk_text(pages: List[Dict], strategy: str = "recursive", chunk_size: int = 1000, chunk_overlap: int = 200) -> List[Dict]:
    chunks = []
    
    if strategy == "recursive":
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=["\n\n", "\n", " ", ""]
        )
    else:
        text_splitter = CharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separator="\n\n"
        )
        
    for page in pages:
        page_chunks = text_splitter.split_text(page["content"])
        for chunk in page_chunks:
            chunks.append({
                "page_num": page["page_num"],
                "content": chunk
            })
            
    return chunks
