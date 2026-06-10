from typing import List, Dict, Any

def build_system_prompt(contexts: List[Dict[str, Any]]) -> str:
    """
    Builds the rigid system prompt enforcing RAG boundaries.
    Instructs the LLM to use inline citations [Source X].
    """
    context_str = ""
    for idx, ctx in enumerate(contexts):
        doc_name = ctx.get("document_name", "Unknown")
        page = ctx.get("page_number", "?")
        content = ctx.get("content", "")
        context_str += f"\n--- Source {idx+1} ---\n"
        context_str += f"Document: {doc_name} (Page {page})\n"
        context_str += f"Content: {content}\n"
        
    prompt = f"""You are an intelligent document assistant.
Your goal is to answer the user's question ONLY using the provided context.

CONTEXT:
{context_str}

RULES:
1. You MUST answer the question using ONLY the facts provided in the CONTEXT above.
2. You MUST cite your sources by using [Source X] inline, where X corresponds to the Source number provided. Example: "The internship runs from June 1 to August 15 [Source 1]."
3. If the answer cannot be found in the context, or if you do not have enough information, you MUST output exactly this phrase and nothing else: "I could not find that information in the uploaded documents."
4. Do not invent facts, hallucinate, or use outside knowledge.
5. Use clear Markdown formatting.
"""
    return prompt

def build_messages(query: str, contexts: List[Dict[str, Any]], history: List[Dict[str, Any]]) -> List[Dict[str, str]]:
    """
    Assembles the final OpenAI-style message list for the LLM.
    Ensures history is bound correctly.
    """
    system_prompt = build_system_prompt(contexts)
    
    messages = [{"role": "system", "content": system_prompt}]
    
    # Append limited history (e.g., last 4 messages to preserve context but limit token bloat)
    for msg in history[-4:]:
        role = msg.get("role", "user")
        # Ensure we only pass text content back
        messages.append({"role": role, "content": msg.get("content", "")})
        
    messages.append({"role": "user", "content": query})
    
    return messages
