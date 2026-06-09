from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from embeddings.generator import generate_embedding
from vectorstore.faiss_store import faiss_store
import os

from database.repositories.chunk_repository import ChunkRepository

# Optional: Using Groq for the RAG LLM
try:
    from groq import Groq
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None
except ImportError:
    client = None

router = APIRouter()

class RAGQuery(BaseModel):
    query: str
    model: str = "llama3-8b-8192" # default groq model
    
@router.post("/")
async def rag_chat(query: RAGQuery):
    # 1. Retrieve context
    query_emb = generate_embedding(query.query)
    retrieved_chunks = faiss_store.search(query_emb, top_k=3)
    
    enriched_chunks = []
    for c in retrieved_chunks:
        chunk_id = c.get("id")
        if chunk_id:
            chunk_meta = await ChunkRepository.get_chunk_by_id(chunk_id)
            if chunk_meta:
                if "_id" in chunk_meta:
                    chunk_meta["_id"] = str(chunk_meta["_id"])
                c.update({"metadata": chunk_meta})
                c["content"] = chunk_meta.get("chunk_text", c.get("content", ""))
        enriched_chunks.append(c)
    
    context_text = "\n\n".join([f"Source (Page {c.get('metadata', {}).get('page_number', '?')}): {c.get('content', '')}" for c in enriched_chunks])
    
    if not context_text:
        context_text = "No relevant context found."
        
    # 2. Build prompt
    system_prompt = f"""
    You are an intelligent RAG assistant. Answer the user's question based strictly on the provided context.
    If the context doesn't contain the answer, say "I don't have enough information to answer that."
    
    CONTEXT:
    {context_text}
    """
    
    # 3. Call LLM
    if client:
        try:
            chat_completion = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": query.query}
                ],
                model=query.model,
            )
            answer = chat_completion.choices[0].message.content
        except Exception as e:
            answer = f"Error calling LLM: {str(e)}"
    else:
        answer = "LLM client not configured (Groq API Key missing)."
        
    return {
        "answer": answer,
        "sources": retrieved_chunks
    }
