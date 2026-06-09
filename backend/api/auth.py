from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import JWTError, jwt
from database.repositories.user_repository import UserRepository
from database.repositories.document_repository import DocumentRepository
from database.repositories.chunk_repository import ChunkRepository
from database.repositories.embedding_repository import EmbeddingRepository
from database.repositories.search_repository import SearchRepository
from database.mongodb import db_client
import os

router = APIRouter()

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 7 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserCreate(BaseModel):
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/signup", response_model=Token)
async def signup(user: UserCreate):
    existing_user = await UserRepository.get_user_by_email(user.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = pwd_context.hash(user.password)
    
    new_user = await UserRepository.create_user(
        email=user.email,
        password_hash=hashed_password
    )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": new_user["email"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=Token)
async def login(user: UserLogin):
    db_user = await UserRepository.get_user_by_email(user.email)
    if not db_user or not pwd_context.verify(user.password, db_user["password"]):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": db_user["email"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = await UserRepository.get_user_by_email(email=email)
    if user is None:
        raise credentials_exception
    if "_id" in user:
        user["_id"] = str(user["_id"])
    return user

@router.get("/me")
async def read_users_me(current_user: dict = Depends(get_current_user)):
    user_copy = current_user.copy()
    user_copy.pop("password", None)
    return user_copy

@router.post("/logout")
async def logout():
    return {"message": "Successfully logged out"}

@router.get("/me/dashboard")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    
    # Get total documents
    doc_count = await DocumentRepository.count_documents_by_user(user_id)
    
    # Get user documents to query chunks
    user_docs = await DocumentRepository.get_documents_by_user(user_id, skip=0, limit=10000)
    doc_ids = [doc["id"] for doc in user_docs]
    
    # Get total chunks
    chunk_count = await db_client.db.chunks.count_documents({"document_id": {"$in": doc_ids}})
    
    # Get total embeddings
    embedding_count = await db_client.db.embeddings.count_documents({"document_id": {"$in": doc_ids}})
    
    # Get total searches
    search_count = await db_client.db.search_history.count_documents({"user_id": user_id})
    
    return {
        "documents": doc_count,
        "chunks": chunk_count,
        "embeddings": embedding_count,
        "searches": search_count
    }
