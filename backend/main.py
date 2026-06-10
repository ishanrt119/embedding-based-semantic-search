import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database.mongodb import db_client
from vectorstore.index_manager import index_manager

app = FastAPI(
    title="DocIntel",
    description="Search, Chat, Compare, and Generate Insights from Your Documents.",
    version="1.0.0"
)

# CORS setup
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
allow_origins = [url.strip() for url in frontend_url.split(",")] if frontend_url else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await db_client.connect()
    index_manager.restore_indexes()

@app.on_event("shutdown")
async def shutdown():
    await db_client.disconnect()

@app.get("/")
def read_root():
    return {"message": "Welcome to the DocIntel API"}

@app.get("/health")
async def health_check():
    mongodb_ok = False
    try:
        if db_client.client:
            await db_client.client.admin.command('ping')
            mongodb_ok = True
    except Exception:
        pass

    groq_ok = bool(os.getenv("GROQ_API_KEY"))
    vector_store_ok = index_manager is not None

    return {
        "status": "healthy" if mongodb_ok and groq_ok and vector_store_ok else "unhealthy",
        "mongodb": mongodb_ok,
        "groq": groq_ok,
        "vector_store": vector_store_ok
    }

from api.auth import router as auth_router
from api.documents import router as documents_router
from api.search import router as search_router
from api.retrieval import router as retrieval_router
from api.chat import router as chat_router
from api.intelligence_routes import router as intelligence_router

app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(documents_router, prefix="/api/documents", tags=["documents"])
app.include_router(search_router, prefix="/api/search", tags=["search"])
app.include_router(retrieval_router, prefix="/api/retrieval", tags=["retrieval"])
app.include_router(chat_router, prefix="/api/chat", tags=["chat"])
app.include_router(intelligence_router, prefix="/api/intelligence", tags=["intelligence"])
