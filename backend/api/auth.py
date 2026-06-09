from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer
import logging

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
from pydantic import BaseModel
import bcrypt

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

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

class UserCreate(BaseModel):
    first_name: str
    last_name: str
    email: str
    password: str
    confirm_password: str

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

@router.post("/signup")
async def signup(user: UserCreate):
    logger.info(f"Signup request received for email: {user.email}")
    
    if user.password != user.confirm_password:
        logger.warning(f"Signup failed: Passwords do not match for {user.email}")
        return JSONResponse(status_code=400, content={"success": False, "message": "Passwords do not match"})

    try:
        existing_user = await UserRepository.get_user_by_email(user.email)
        if existing_user:
            logger.warning(f"Signup failed: Email already registered for {user.email}")
            return JSONResponse(status_code=400, content={"success": False, "message": "Email already registered"})
        
        hashed_password = hash_password(user.password)
        
        new_user = await UserRepository.create_user(
            email=user.email,
            password_hash=hashed_password,
            first_name=user.first_name,
            last_name=user.last_name
        )
        
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": new_user["email"]}, expires_delta=access_token_expires
        )
        
        logger.info(f"User created successfully: {user.email}")
        return {"success": True, "access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        logger.error(f"Signup failed with exception: {str(e)}", exc_info=True)
        return JSONResponse(status_code=500, content={"success": False, "message": "An unexpected error occurred during signup"})

@router.post("/login", response_model=Token)
async def login(user: UserLogin):
    db_user = await UserRepository.get_user_by_email(user.email)
    if not db_user or not verify_password(user.password, db_user["password"]):
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
