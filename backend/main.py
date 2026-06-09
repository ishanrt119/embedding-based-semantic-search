from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database.mongodb import db_client

app = FastAPI(
    title="AI Semantic Search & RAG Platform",
    description="Backend API for document indexing, semantic search, and RAG.",
    version="1.0.0"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await db_client.connect()

@app.on_event("shutdown")
async def shutdown():
    await db_client.disconnect()

@app.get("/")
def read_root():
    return {"message": "Welcome to the AI Semantic Search & RAG Platform API"}

from api import auth, documents, search, rag

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
app.include_router(search.router, prefix="/api/search", tags=["search"])
app.include_router(rag.router, prefix="/api/rag", tags=["rag"])
