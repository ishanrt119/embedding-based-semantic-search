import time
import math
import statistics
import re
from typing import List, Dict, Any, Optional
from services.logger import logger
from database.client import db

def estimate_token_count(text: str) -> int:
    """Roughly estimate token count by splitting on whitespace and punctuation."""
    return len(re.findall(r'\w+|[^\s\w]+', text))

def fixed_chunking(text: str, chunk_size: int, chunk_overlap: int) -> List[str]:
    """Split text by fixed character length with overlap."""
    if chunk_size <= 0:
        raise ValueError("chunk_size must be positive")
    if chunk_overlap >= chunk_size:
        raise ValueError("chunk_overlap must be less than chunk_size")
        
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        if end >= len(text):
            break
        start += chunk_size - chunk_overlap
    return chunks

def recursive_chunking(text: str, chunk_size: int, chunk_overlap: int) -> List[str]:
    """Split text recursively using LangChain."""
    try:
        from langchain_text_splitters import RecursiveCharacterTextSplitter
    except ImportError:
        logger.error("Langchain is not installed.")
        raise
        
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", " ", ""]
    )
    return splitter.split_text(text)

def semantic_chunking(text: str, max_chunk_size: int, chunk_overlap: int) -> List[str]:
    """Split text intelligently using sentence-transformers."""
    try:
        from sentence_transformers import SentenceTransformer
        import numpy as np
    except ImportError:
        logger.error("sentence-transformers or numpy not installed.")
        raise
        
    # Split into sentences (simple approximation)
    import re
    # Match sentences
    sentences = re.split(r'(?<=[.!?]) +', text)
    if not sentences or len(sentences) == 1:
        # If very few sentences, fallback to recursive
        return recursive_chunking(text, max_chunk_size, chunk_overlap)
        
    # Load model (will download if first time)
    model = SentenceTransformer('all-MiniLM-L6-v2')
    
    embeddings = model.encode(sentences)
    
    # Calculate similarities between consecutive sentences
    similarities = []
    for i in range(len(embeddings) - 1):
        # Cosine similarity
        v1 = embeddings[i]
        v2 = embeddings[i + 1]
        sim = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))
        similarities.append(sim)
        
    # Find percentile for threshold to determine topic shifts (valleys)
    if not similarities:
        return [text]
        
    threshold = np.percentile(similarities, 20) # Bottom 20% are considered shifts
    
    chunks = []
    current_chunk_sentences = []
    current_chunk_size = 0
    
    for i, sentence in enumerate(sentences):
        sentence_size = len(sentence)
        
        # If adding this sentence exceeds max size, we must break here regardless of topic
        if current_chunk_size + sentence_size > max_chunk_size and current_chunk_sentences:
            chunks.append(" ".join(current_chunk_sentences))
            
            # Keep overlap sentences
            overlap_text = ""
            overlap_sentences = []
            for s in reversed(current_chunk_sentences):
                if len(overlap_text) + len(s) > chunk_overlap:
                    break
                overlap_sentences.insert(0, s)
                overlap_text = " ".join(overlap_sentences)
                
            current_chunk_sentences = overlap_sentences
            current_chunk_size = len(overlap_text)
            
        current_chunk_sentences.append(sentence)
        current_chunk_size += sentence_size + 1 # +1 for space
        
        # Topic shift detected
        if i < len(similarities) and similarities[i] < threshold:
            if current_chunk_size > max_chunk_size // 2: # Only split if it's decently sized
                chunks.append(" ".join(current_chunk_sentences))
                
                # Handling overlap
                overlap_text = ""
                overlap_sentences = []
                for s in reversed(current_chunk_sentences):
                    if len(overlap_text) + len(s) > chunk_overlap:
                        break
                    overlap_sentences.insert(0, s)
                    overlap_text = " ".join(overlap_sentences)
                
                current_chunk_sentences = overlap_sentences
                current_chunk_size = len(overlap_text)
                
    if current_chunk_sentences:
        chunks.append(" ".join(current_chunk_sentences))
        
    return chunks

async def save_chunks(document_id: str, user_id: str, chunks_text: List[str], strategy: str) -> List[Dict[str, Any]]:
    """Save chunks to the database and return their metadata."""
    chunks_data = []
    
    # We use Prisma to create multiple
    for i, text in enumerate(chunks_text):
        token_count = estimate_token_count(text)
        char_count = len(text)
        
        chunk = await db.chunk.create(
            data={
                "document_id": document_id,
                "user_id": user_id,
                "chunk_index": i,
                "chunk_text": text,
                "chunk_strategy": strategy,
                "token_count": token_count,
                "character_count": char_count
            }
        )
        chunks_data.append(chunk)
        
    return chunks_data

async def delete_chunks(document_id: str):
    """Delete all chunks for a document."""
    await db.chunk.delete_many(where={"document_id": document_id})
    await db.document.update(
        where={"id": document_id},
        data={"processing_status": "extracted"}
    )

async def get_chunk_statistics(document_id: str) -> Dict[str, Any]:
    """Calculate and return statistics about chunks for a document."""
    chunks = await db.chunk.find_many(where={"document_id": document_id})
    
    if not chunks:
        return {
            "total_chunks": 0,
            "avg_tokens": 0,
            "avg_characters": 0,
            "largest_chunk": 0,
            "smallest_chunk": 0,
            "chunk_variance": 0
        }
        
    char_counts = [c.character_count for c in chunks]
    token_counts = [c.token_count for c in chunks]
    
    avg_chars = sum(char_counts) / len(char_counts)
    
    variance = 0
    if len(char_counts) > 1:
        variance = statistics.variance(char_counts)
        
    return {
        "total_chunks": len(chunks),
        "avg_tokens": int(sum(token_counts) / len(token_counts)),
        "avg_characters": int(avg_chars),
        "largest_chunk": max(char_counts),
        "smallest_chunk": min(char_counts),
        "chunk_variance": int(variance),
        "token_distribution": {
            "min": min(token_counts),
            "max": max(token_counts),
        }
    }

async def create_chunks(document_id: str, strategy: str = "recursive", chunk_size: int = 1000, overlap: int = 200) -> Dict[str, Any]:
    """Orchestrate the chunking process."""
    start_time = time.time()
    
    try:
        # Validate configuration
        if chunk_size <= overlap:
            raise ValueError("chunk_size must be greater than overlap")
            
        logger.info(f"Chunk creation started for {document_id} using {strategy} strategy")
        
        # 1. Fetch document and text
        document = await db.document.find_unique(where={"id": document_id})
        if not document:
            raise ValueError("Document not found")
            
        # Get text (Assuming we read from file or we should extract text on the fly if not stored in DB)
        # The prompt says "documents without extracted text" should be rejected.
        # But document text is not stored in the DB schema! It just says "processing_status = 'extracted'".
        # I'll read the text from the file again since it's not in the DB, using `document_processor`
        from services.document_processor import extract_text
        try:
            text = extract_text(document.storage_path, document.file_type)
        except Exception as e:
            raise ValueError(f"Failed to extract text: {e}")
            
        if not text or not text.strip():
            raise ValueError("Document is empty or has no extracted text")
            
        # 2. Delete existing chunks if any
        await delete_chunks(document_id)
        
        # 3. Perform chunking
        if strategy == "fixed":
            chunks_text = fixed_chunking(text, chunk_size, overlap)
        elif strategy == "semantic":
            chunks_text = semantic_chunking(text, chunk_size, overlap)
        else: # default recursive
            chunks_text = recursive_chunking(text, chunk_size, overlap)
            
        # 4. Save chunks
        await save_chunks(document_id, document.user_id, chunks_text, strategy)
        
        # Update document status
        await db.document.update(
            where={"id": document_id},
            data={"processing_status": "chunked"}
        )
        
        duration = time.time() - start_time
        logger.info(f"Chunk creation completed for {document_id}. Strategy: {strategy}. Chunks: {len(chunks_text)}. Time: {duration:.2f}s")
        
        return {
            "chunks_created": len(chunks_text),
            "strategy": strategy,
            "avg_chunk_size": int(sum(len(c) for c in chunks_text) / len(chunks_text)) if chunks_text else 0,
            "duration_seconds": round(duration, 2)
        }
        
    except Exception as e:
        logger.error(f"Chunk creation failed for {document_id}: {str(e)}")
        raise e
