from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from typing import List, Optional
from database.client import db
import shutil
import os
import uuid

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Mock dependency for getting current user (should use JWT token logic)
async def get_current_user_id():
    # In a real app, this parses the JWT token
    # For now, we assume a mock user ID or fetch the first user
    user = await db.user.find_first()
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return user.id

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    dataset_name: str = Form(...),
    user_id: str = Depends(get_current_user_id)
):
    file_ext = file.filename.split('.')[-1].upper()
    if file_ext not in ["PDF", "CSV", "TXT", "DOCX"]:
        raise HTTPException(status_code=400, detail="Unsupported file type")
        
    # Save file
    file_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}_{file.filename}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Create dataset record
    dataset = await db.dataset.create(
        data={
            "name": dataset_name,
            "type": file_ext,
            "status": "PROCESSING",
            "userId": user_id
        }
    )
    
    # Trigger background processing task here
    # E.g., background_tasks.add_task(process_document, file_path, dataset.id)
    
    return {"message": "Upload successful, processing started.", "dataset_id": dataset.id}

@router.get("/datasets")
async def get_datasets(user_id: str = Depends(get_current_user_id)):
    datasets = await db.dataset.find_many(where={"userId": user_id})
    return datasets
