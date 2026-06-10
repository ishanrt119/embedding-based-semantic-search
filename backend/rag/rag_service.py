import os
from typing import List, Dict, Any

try:
    from groq import Groq
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None
except ImportError:
    client = None

class RAGService:
    @staticmethod
    async def generate_answer(messages: List[Dict[str, str]]) -> str:
        if not client:
            return "Error: Groq client is not initialized. Please ensure the GROQ_API_KEY is configured."
            
        try:
            # Attempt with the primary versatile model
            chat_completion = client.chat.completions.create(
                messages=messages,
                model="llama-3.3-70b-versatile",
                temperature=0.0 # strict adherence
            )
            return chat_completion.choices[0].message.content
        except Exception as e:
            # Programmatic fallback
            try:
                chat_completion = client.chat.completions.create(
                    messages=messages,
                    model="llama-3.1-8b-instant",
                    temperature=0.0
                )
                return chat_completion.choices[0].message.content
            except Exception as inner_e:
                return f"Error: Failed to generate response from LLM. {str(inner_e)}"

rag_service = RAGService()
