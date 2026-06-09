from abc import ABC, abstractmethod
import tiktoken
from typing import List, Dict, Any

class BaseChunker(ABC):
    def __init__(self, chunk_size: int, chunk_overlap: int):
        if chunk_size <= 0:
            raise ValueError("chunk_size must be positive")
        if chunk_overlap >= chunk_size:
            raise ValueError("chunk_overlap must be less than chunk_size")
        if chunk_overlap < 0:
            raise ValueError("chunk_overlap must be non-negative")
            
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        
        # Initialize tiktoken for token counting
        try:
            self.tokenizer = tiktoken.get_encoding("cl100k_base")
        except Exception as e:
            raise RuntimeError(f"Failed to initialize tokenizer: {e}")

    def count_tokens(self, text: str) -> int:
        """Accurately count tokens using tiktoken."""
        return len(self.tokenizer.encode(text))

    def validate_chunk(self, chunk_text: str) -> bool:
        """Validate if a chunk is acceptable."""
        # Check empty or whitespace only
        if not chunk_text or not chunk_text.strip():
            return False
            
        # Check minimum characters (50 chars)
        if len(chunk_text.strip()) < 50:
            return False
            
        return True

    @abstractmethod
    def chunk_document(self, pages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Takes a list of pages: [{"page_number": int, "text": str}]
        Returns a list of chunk dicts: [{"content": str, "page_number": int, "token_count": int, ...}]
        """
        pass
