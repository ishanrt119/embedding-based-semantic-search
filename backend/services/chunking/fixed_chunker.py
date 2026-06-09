from typing import List, Dict, Any
from .base import BaseChunker

class FixedChunker(BaseChunker):
    def chunk_document(self, pages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        chunks = []
        current_chunk_text = ""
        current_page = 1 if pages else 1
        
        # To maintain page boundaries, we will process text linearly, but remember the page where a chunk starts.
        # Let's concatenate everything with a marker, or simply track offset.
        
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
            
        def get_page_number_for_offset(offset: int) -> int:
            for p in page_offsets:
                if p["start"] <= offset < p["end"]:
                    return p["page_number"]
            return 1

        start = 0
        seen_chunks = set()
        
        while start < len(full_text):
            end = start + self.chunk_size
            chunk_text = full_text[start:end]
            
            # Prevent going out of bounds
            if start >= len(full_text):
                break
                
            if self.validate_chunk(chunk_text):
                # Prevent duplicates
                chunk_hash = hash(chunk_text)
                if chunk_hash not in seen_chunks:
                    seen_chunks.add(chunk_hash)
                    
                    page_number = get_page_number_for_offset(start)
                    token_count = self.count_tokens(chunk_text)
                    
                    # Prevent chunks exceeding configured limit by checking token count? 
                    # The prompt says "exceeding configured limit". The fixed size naturally restricts characters.
                    
                    chunks.append({
                        "content": chunk_text,
                        "page_number": page_number,
                        "token_count": token_count,
                        "chunk_strategy": "fixed",
                        "chunk_size": self.chunk_size,
                        "chunk_overlap": self.chunk_overlap
                    })
            
            start += self.chunk_size - self.chunk_overlap
            
        return chunks
