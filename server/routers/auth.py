from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from database import get_session
from models import User, Role, LinkageCode
from auth import get_password_hash, verify_password, create_access_token
from pydantic import BaseModel
from datetime import datetime
from routers.notifications import create_notification

router = APIRouter(prefix="/api/auth", tags=["auth"])

class UserCreate(BaseModel):
    email: str
    password: str
    role: Role
    name: str | None = None
    linkage_code: str | None = None
    specialization: str | None = None
    license_number: str | None = None

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    token: str
    user: dict

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, session: Session = Depends(get_session)):
    # Check if user exists
    statement = select(User).where(User.email == user_data.email)
    existing_user = session.exec(statement).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    therapist_id = None
    
    # Verify Linkage Code for Patient
    if user_data.role == Role.PATIENT:
        if not user_data.linkage_code:
            raise HTTPException(status_code=400, detail="Linkage code required for this role")
        
        statement = select(LinkageCode).where(LinkageCode.code == user_data.linkage_code)
        linkage = session.exec(statement).first()
        
        if not linkage:
            raise HTTPException(status_code=400, detail="Invalid linkage code")
        
        if linkage.expires_at < datetime.utcnow():
            raise HTTPException(status_code=400, detail="Linkage code expired")
            
        if linkage.patient_linked:
            raise HTTPException(status_code=400, detail="Linkage code already used by a patient")
        
        linkage.patient_linked = True
        therapist_id = linkage.therapist_id
        
        session.add(linkage)

    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        password=hashed_password,
        role=user_data.role,
        name=user_data.name,
        therapist_id=therapist_id,
        specialization=user_data.specialization,
        license_number=user_data.license_number
    )
    session.add(new_user)
    session.commit()
    session.refresh(new_user)

    # Create event-driven notifications
    if user_data.role == Role.PATIENT and therapist_id:
        # Welcome notification for patient
        therapist = session.get(User, therapist_id)
        t_name = therapist.name if therapist else "your therapist"
        create_notification(
            session, new_user.id, "welcome",
            "Welcome to OTease!",
            f"You're connected with therapist {t_name}. Start your recovery journey!"
        )
        # New patient notification for therapist
        create_notification(
            session, therapist_id, "patient",
            "New Patient Registered",
            f"{user_data.name or 'A patient'} created an account using your linkage code"
        )
        session.commit()

    return {"message": "User created successfully", "userId": new_user.id}

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, session: Session = Depends(get_session)):
    statement = select(User).where(User.email == login_data.email)
    user = session.exec(statement).first()
    
    if not user or not verify_password(login_data.password, user.password):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    
    token = create_access_token(data={"id": user.id, "role": user.role.value})
    return {
        "token": token,
        "user": {
            "id": user.id,
            "email": user.email,
            "role": user.role.value,
            "name": user.name
        }
    }
