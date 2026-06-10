from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from api.auth import get_current_user
from database.repositories.chat_repository import ChatRepository
from rag.chat_service import chat_service

router = APIRouter()

async def get_current_user_id(current_user: dict = Depends(get_current_user)):
    return current_user["id"]

class ChatMessage(BaseModel):
    message: str
    dataset_id: Optional[str] = None
    conversation_id: Optional[str] = None

class RenameSessionRequest(BaseModel):
    title: str

@router.post("/")
async def process_chat(msg: ChatMessage, user_id: str = Depends(get_current_user_id)):
    if not msg.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")
        
    try:
        result = await chat_service.process_chat(
            message=msg.message,
            user_id=user_id,
            conversation_id=msg.conversation_id,
            dataset_id=msg.dataset_id
        )
        
        from database.repositories.usage_repository import UsageRepository
        try:
            await UsageRepository.increment_search(user_id)
        except Exception:
            pass
            
        return result
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/sessions/{session_id}")
async def rename_session(session_id: str, req: RenameSessionRequest, user_id: str = Depends(get_current_user_id)):
    session = await ChatRepository.get_session_by_id(session_id)
    if not session or session.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    await ChatRepository.rename_session(session_id, req.title)
    return {"status": "success"}

@router.get("/history")
async def get_chat_sessions(user_id: str = Depends(get_current_user_id), limit: int = 20):
    sessions = await ChatRepository.get_sessions_by_user(user_id, skip=0, limit=limit)
    for s in sessions:
        if "_id" in s:
            s["_id"] = str(s["_id"])
    return sessions

@router.get("/history/{conversation_id}")
async def get_chat_session(conversation_id: str, user_id: str = Depends(get_current_user_id)):
    session = await ChatRepository.get_session_by_id(conversation_id)
    if not session or session.get("user_id") != user_id:
        raise HTTPException(status_code=404, detail="Chat session not found")
    if "_id" in session:
        session["_id"] = str(session["_id"])
    return session

@router.get("/suggestions")
async def get_suggestions(dataset_id: str, user_id: str = Depends(get_current_user_id)):
    from database.repositories.chunk_repository import ChunkRepository
    from rag.rag_service import rag_service
    import json
    
    cursor = ChunkRepository.get_collection().aggregate([
        {"$match": {"dataset_id": dataset_id}},
        {"$sample": {"size": 2}}
    ])
    chunks = await cursor.to_list(length=2)
    
    if not chunks:
        return {"suggestions": ["What is this dataset about?"]}
        
    text = " ".join([c.get("chunk_text", "") for c in chunks])
    
    prompt = f"""Based on the following text, generate 3 short, distinct questions that a user might ask.
Return ONLY a JSON array of strings, like: ["Question 1?", "Question 2?", "Question 3?"]. No markdown formatting or extra text.

TEXT:
{text}"""

    try:
        raw_ans = await rag_service.generate_answer([{"role": "user", "content": prompt}])
        # clean if llm wrapped in markdown
        raw_ans = raw_ans.replace("```json", "").replace("```", "").strip()
        suggestions = json.loads(raw_ans)
        if isinstance(suggestions, list):
            return {"suggestions": suggestions[:3]}
    except Exception:
        pass
        
    return {"suggestions": ["What are the main topics discussed?", "Can you summarize the key points?", "What are the most important takeaways?"]}
