from typing import List, Dict, Any
import re
from .base import BaseChunker
from .recursive_chunker import RecursiveChunker
from services.logger import logger

class SemanticChunker(BaseChunker):
    def chunk_document(self, pages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        try:
            from sentence_transformers import SentenceTransformer
            import numpy as np
        except ImportError:
            logger.error("sentence-transformers or numpy not installed.")
            raise RuntimeError("sentence-transformers required for semantic chunking.")
            
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
            idx = full_text.find(text_substring)
            if idx == -1:
                return 1
            for p in page_offsets:
                if p["start"] <= idx < p["end"]:
                    return p["page_number"]
            return 1
            
        sentences = re.split(r'(?<=[.!?]) +', full_text)
        if not sentences or len(sentences) <= 1:
            # Fallback to recursive
            recursive_chunker = RecursiveChunker(self.chunk_size, self.chunk_overlap)
            return recursive_chunker.chunk_document(pages)
            
        # Initialize model (can be optimized by loading once globally, but keeping it simple as per original)
        model = SentenceTransformer('all-MiniLM-L6-v2')
        embeddings = model.encode(sentences)
        
        similarities = []
        for i in range(len(embeddings) - 1):
            v1 = embeddings[i]
            v2 = embeddings[i + 1]
            # Cosine similarity
            sim = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))
            similarities.append(sim)
            
        if not similarities:
            return []
            
        threshold = np.percentile(similarities, 20)
        
        raw_chunks = []
        current_chunk_sentences = []
        current_chunk_size = 0
        
        for i, sentence in enumerate(sentences):
            sentence_size = len(sentence)
            
            if current_chunk_size + sentence_size > self.chunk_size and current_chunk_sentences:
                raw_chunks.append(" ".join(current_chunk_sentences))
                
                # Apply overlap
                overlap_text = ""
                overlap_sentences = []
                for s in reversed(current_chunk_sentences):
                    if len(overlap_text) + len(s) > self.chunk_overlap:
                        break
                    overlap_sentences.insert(0, s)
                    overlap_text = " ".join(overlap_sentences)
                    
                current_chunk_sentences = overlap_sentences
                current_chunk_size = len(overlap_text)
                
            current_chunk_sentences.append(sentence)
            current_chunk_size += sentence_size + 1 
            
            if i < len(similarities) and similarities[i] < threshold:
                if current_chunk_size > self.chunk_size // 2: 
                    raw_chunks.append(" ".join(current_chunk_sentences))
                    
                    overlap_text = ""
                    overlap_sentences = []
                    for s in reversed(current_chunk_sentences):
                        if len(overlap_text) + len(s) > self.chunk_overlap:
                            break
                        overlap_sentences.insert(0, s)
                        overlap_text = " ".join(overlap_sentences)
                    
                    current_chunk_sentences = overlap_sentences
                    current_chunk_size = len(overlap_text)
                    
        if current_chunk_sentences:
            raw_chunks.append(" ".join(current_chunk_sentences))
            
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
                        "chunk_strategy": "semantic",
                        "chunk_size": self.chunk_size,
                        "chunk_overlap": self.chunk_overlap
                    })
                    
        return chunks
