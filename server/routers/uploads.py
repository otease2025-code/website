from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlmodel import Session, select
from database import get_session
from models import User, Role, MediaUpload
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
import uuid
import os
import base64

router = APIRouter(prefix="/api/uploads", tags=["uploads"])

# Configuration
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]
ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"]
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")

# Ensure upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)

class MediaUploadRequest(BaseModel):
    file_name: str
    file_type: str  # "image" or "video"
    mime_type: str
    file_size: int
    description: Optional[str] = None
    file_data: str  # Base64 encoded file data

class MediaUploadResponse(BaseModel):
    id: str
    file_name: str
    file_type: str
    file_url: str
    description: Optional[str]
    created_at: datetime

@router.post("/upload", status_code=status.HTTP_201_CREATED)
def upload_media(patient_id: str, upload_data: MediaUploadRequest, session: Session = Depends(get_session)):
    """Upload a media file (photo or video) for a patient"""
    
    # Validate file size
    if upload_data.file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400, 
            detail=f"File size exceeds maximum allowed size of {MAX_FILE_SIZE / (1024*1024)}MB"
        )
    
    # Validate file type
    if upload_data.file_type == "image":
        if upload_data.mime_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(status_code=400, detail="Invalid image type. Allowed: JPEG, PNG, GIF, WebP")
    elif upload_data.file_type == "video":
        if upload_data.mime_type not in ALLOWED_VIDEO_TYPES:
            raise HTTPException(status_code=400, detail="Invalid video type. Allowed: MP4, MOV, WebM")
    else:
        raise HTTPException(status_code=400, detail="Invalid file type. Must be 'image' or 'video'")
    
    # Verify patient exists
    patient = session.get(User, patient_id)
    if not patient or patient.role != Role.PATIENT:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Generate unique filename
    file_extension = upload_data.file_name.split('.')[-1] if '.' in upload_data.file_name else ''
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    s3_key = f"patients/{patient_id}/{unique_filename}"
    
    # For local storage (replace with S3 in production)
    local_path = os.path.join(UPLOAD_DIR, patient_id)
    os.makedirs(local_path, exist_ok=True)
    file_path = os.path.join(local_path, unique_filename)
    
    try:
        # Decode and save file
        file_bytes = base64.b64decode(upload_data.file_data)
        with open(file_path, 'wb') as f:
            f.write(file_bytes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    # Create database record
    media = MediaUpload(
        patient_id=patient_id,
        file_name=upload_data.file_name,
        s3_key=s3_key,
        file_type=upload_data.file_type,
        mime_type=upload_data.mime_type,
        file_size=upload_data.file_size,
        description=upload_data.description
    )
    session.add(media)
    session.commit()
    session.refresh(media)
    
    return {
        "id": media.id,
        "file_name": media.file_name,
        "file_type": media.file_type,
        "message": "File uploaded successfully"
    }

@router.get("/patient/{patient_id}", response_model=List[MediaUploadResponse])
def get_patient_media(patient_id: str, session: Session = Depends(get_session)):
    """Get all media uploads for a patient"""
    
    statement = select(MediaUpload).where(MediaUpload.patient_id == patient_id).order_by(MediaUpload.created_at.desc())
    media_list = session.exec(statement).all()
    
    return [
        MediaUploadResponse(
            id=m.id,
            file_name=m.file_name,
            file_type=m.file_type,
            file_url=f"/api/uploads/file/{m.id}",
            description=m.description,
            created_at=m.created_at
        )
        for m in media_list
    ]

@router.get("/file/{media_id}")
def get_media_file(media_id: str, session: Session = Depends(get_session)):
    """Get a specific media file"""
    from fastapi.responses import FileResponse
    
    media = session.get(MediaUpload, media_id)
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
    
    # Extract filename from s3_key
    filename = media.s3_key.split('/')[-1]
    file_path = os.path.join(UPLOAD_DIR, media.patient_id, filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found on server")
    
    return FileResponse(file_path, media_type=media.mime_type, filename=media.file_name)

@router.delete("/{media_id}")
def delete_media(media_id: str, patient_id: str, session: Session = Depends(get_session)):
    """Delete a media file"""
    
    media = session.get(MediaUpload, media_id)
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
    
    # Verify ownership
    if media.patient_id != patient_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this media")
    
    # Delete file from disk
    filename = media.s3_key.split('/')[-1]
    file_path = os.path.join(UPLOAD_DIR, media.patient_id, filename)
    if os.path.exists(file_path):
        os.remove(file_path)
    
    # Delete database record
    session.delete(media)
    session.commit()
    
    return {"message": "Media deleted successfully"}
