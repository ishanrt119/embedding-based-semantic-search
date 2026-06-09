from typing import List, Dict, Any
from .base import BaseChunker
from services.logger import logger

class RecursiveChunker(BaseChunker):
    def chunk_document(self, pages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        try:
            from langchain_text_splitters import RecursiveCharacterTextSplitter
        except ImportError:
            logger.error("Langchain is not installed.")
            raise RuntimeError("langchain-text-splitters required for recursive chunking.")
            
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap,
            separators=["\n\n", "\n", " ", ""]
        )
        
        full_text = ""
        page_offsets = []
        for page in pages:
            start_idx = len(full_text)
            text = page["text"]
            full_text += text
            page_offsets.append({
                "page_number": page["page_number"],
                "start": start_idx,
                "end": len(full_text)
            })
            
        def get_page_number_for_offset(text_substring: str) -> int:
            # Find the first occurrence of this chunk to estimate page number
            idx = full_text.find(text_substring)
            if idx == -1:
                return 1
            for p in page_offsets:
                if p["start"] <= idx < p["end"]:
                    return p["page_number"]
            return 1
            
        raw_chunks = splitter.split_text(full_text)
        chunks = []
        seen_chunks = set()
        
        for text in raw_chunks:
            if self.validate_chunk(text):
                chunk_hash = hash(text)
                if chunk_hash not in seen_chunks:
                    seen_chunks.add(chunk_hash)
                    
                    chunks.append({
                        "content": text,
                        "page_number": get_page_number_for_offset(text),
                        "token_count": self.count_tokens(text),
                        "chunk_strategy": "recursive",
                        "chunk_size": self.chunk_size,
                        "chunk_overlap": self.chunk_overlap
                    })
                    
        return chunks
