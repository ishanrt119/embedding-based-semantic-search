import time
from typing import Dict, Any, Optional
from retrieval_engine.retrieval_service import retrieval_service
from database.repositories.chat_repository import ChatRepository
from database.repositories.chat_analytics_repository import ChatAnalyticsRepository

from .prompt_builder import build_messages
from .rag_service import rag_service
from .answer_validator import validate_and_extract_citations

class ChatService:
    @staticmethod
    async def process_chat(message: str, user_id: str, conversation_id: Optional[str] = None, dataset_id: Optional[str] = None) -> Dict[str, Any]:
        start_time = time.time()
        
        # 1. Manage Conversation Session
        if not conversation_id:
            session = await ChatRepository.create_session(user_id)
            conversation_id = session["id"]
        else:
            session = await ChatRepository.get_session_by_id(conversation_id)
            if not session or session.get("user_id") != user_id:
                raise ValueError("Conversation not found or unauthorized.")
                
        # Fetch history before adding current message to limit bloat
        history = session.get("messages", []) if conversation_id else []
        
        # Log user message
        await ChatRepository.add_message(conversation_id, "user", message)
        
        # 2. Retrieve Context
        retrieval_start = time.time()
        retrieval_result = await retrieval_service.get_context(
            query=message,
            user_id=user_id,
            top_k=8,  # RAG context chunks
            max_tokens=3000, # Leave room for history and generation
            dataset_id=dataset_id
        )
        contexts = retrieval_result.get("contexts", [])
        retrieval_time = (time.time() - retrieval_start) * 1000
        
        # 3. Build Prompt with Strict Rules
        messages = build_messages(message, contexts, history)
        
        # 4. Generate Answer via Groq
        gen_start = time.time()
        raw_answer = await rag_service.generate_answer(messages)
        gen_time = (time.time() - gen_start) * 1000
        
        # 5. Validate Answer & Extract Citations
        validated_answer, citations = validate_and_extract_citations(raw_answer, contexts)
        
        # 6. Log Assistant Message
        await ChatRepository.add_message(conversation_id, "assistant", validated_answer, sources=citations)
        
        total_time = (time.time() - start_time) * 1000
        
        # 7. Log Analytics
        avg_confidence = sum(c.get("confidence", 0) for c in citations) / len(citations) if citations else 0.0
        
        from database.repositories.citation_analytics_repository import CitationAnalyticsRepository
        await CitationAnalyticsRepository.log_citations(
            user_id=user_id,
            question=message,
            citations=citations,
            avg_confidence=avg_confidence
        )
        
        await ChatAnalyticsRepository.log_analytics(
            user_id=user_id,
            question=message,
            answer_length=len(validated_answer),
            retrieval_time_ms=retrieval_time,
            generation_time_ms=gen_time,
            citation_count=len(citations),
            total_latency_ms=total_time
        )
        
        # 8. Build Transparency Object
        transparency = {
            "sources_used": len(citations),
            "retrieved_chunks_count": len(contexts),
            "context_tokens": sum(c.get("token_count", 0) for c in contexts),
            "generation_time_ms": round(gen_time, 2),
            "retrieval_time_ms": round(retrieval_time, 2),
            "all_contexts": contexts
        }
        
        return {
            "answer": validated_answer,
            "citations": citations,
            "transparency": transparency,
            "conversation_id": conversation_id
        }

chat_service = ChatService()
