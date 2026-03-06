from typing import Optional, List
from datetime import datetime, time, timezone, timedelta

IST = timezone(timedelta(hours=5, minutes=30))

def ist_now():
    return datetime.now(IST).replace(tzinfo=None)
from enum import Enum
from sqlmodel import Field, SQLModel, Relationship
import uuid

class Role(str, Enum):
    PATIENT = "PATIENT"
    THERAPIST = "THERAPIST"
    CAREGIVER = "CAREGIVER"

class User(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    email: str = Field(unique=True, index=True)
    password: str
    name: Optional[str] = None
    role: Role
    createdAt: datetime = Field(default_factory=ist_now)
    updatedAt: datetime = Field(default_factory=ist_now)
    
    # Relationships
    therapist_id: Optional[str] = Field(default=None, foreign_key="user.id")
    caregiver_patient_id: Optional[str] = Field(default=None, foreign_key="user.id")
    
    # Therapist specific fields
    specialization: Optional[str] = None
    license_number: Optional[str] = None
    
    # Caregiver specific fields
    phone: Optional[str] = None
    address: Optional[str] = None
    experience: Optional[str] = None
    certification: Optional[str] = None
    
    # Patient specific fields
    caregiver_code: Optional[str] = None

    # ---> ADDED FOR PUSH NOTIFICATIONS <---
    fcm_token: Optional[str] = None

class CaregiverPatient(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    caregiver_id: str = Field(foreign_key="user.id")
    patient_id: str = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=ist_now)

class LinkageCode(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    code: str = Field(unique=True, index=True)
    therapist_id: str = Field(foreign_key="user.id")
    expires_at: datetime
    is_used: bool = False # Deprecated, kept for backward compatibility if needed
    patient_linked: bool = Field(default=False)
    caregiver_linked: bool = Field(default=False)
    created_at: datetime = Field(default_factory=ist_now)

class Task(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    title: str
    description: Optional[str] = None
    assigned_to_id: str = Field(foreign_key="user.id")
    assigned_by_id: str = Field(foreign_key="user.id")
    task_type: str = Field(default="general") # "adl_schedule" or "therapist_task"
    scheduled_date: str  # Storing as string "YYYY-MM-DD" 
    start_time: str # Storing as string "HH:MM" for simplicity
    end_time: str   # Storing as string "HH:MM"
    is_completed: bool = False
    verified_by_caregiver: bool = False
    proof_media_id: Optional[str] = None
    verification_notes: Optional[str] = None
    created_at: datetime = Field(default_factory=ist_now)

class CaregiverNote(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    content: str
    author_id: str = Field(foreign_key="user.id")
    patient_id: str = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=ist_now)

class MoodEntry(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    user_id: str = Field(foreign_key="user.id")
    mood_score: int # 1-5 or similar
    primary_emotion: Optional[str] = None
    secondary_emotion: Optional[str] = None
    tertiary_emotion: Optional[str] = None
    journal_text: Optional[str] = None
    created_at: datetime = Field(default_factory=ist_now)

class Appointment(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    therapist_id: str = Field(foreign_key="user.id")
    patient_id: str = Field(foreign_key="user.id")
    datetime: datetime # Back to simple naive datetime
    is_recurring: bool = False
    created_at: datetime = Field(default_factory=ist_now)

class Billing(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    patient_id: str = Field(foreign_key="user.id")
    therapist_id: str = Field(foreign_key="user.id")
    description: Optional[str] = None  # Service description
    amount: float
    status: str = "PENDING" # PENDING, PAID
    payment_method: Optional[str] = None  # Cash, UPI, Card, Cheque
    transaction_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=ist_now)

class MediaUpload(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    patient_id: str = Field(foreign_key="user.id")  # Who uploaded
    file_name: str  # Original filename
    s3_key: str  # S3 object key or local path
    file_type: str  # "image" or "video"
    mime_type: str  # e.g., "image/jpeg", "video/mp4"
    file_size: int  # Size in bytes
    description: Optional[str] = None  # Optional caption
    created_at: datetime = Field(default_factory=ist_now)

class Notification(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    user_id: str = Field(foreign_key="user.id")  # Recipient
    type: str  # appointment, task, patient, alert, billing, welcome, caregiver_link
    title: str
    message: str
    is_read: bool = Field(default=False)
    created_at: datetime = Field(default_factory=ist_now)

class PatientProfile(SQLModel, table=True):
    """Stores all therapist-entered clinical profile data for a patient."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    patient_id: str = Field(foreign_key="user.id", unique=True, index=True)

    # Demographic
    age_sex: Optional[str] = None
    hospital_no: Optional[str] = None
    marital_status: Optional[str] = None
    language: Optional[str] = None
    education: Optional[str] = None
    occupation: Optional[str] = None
    diagnosis: Optional[str] = None
    admission_date: Optional[str] = None
    assessment_date: Optional[str] = None
    informant: Optional[str] = None
    reliability: Optional[str] = None

    # Chief Complaints
    complaints_subjective: Optional[str] = None
    complaints_objective: Optional[str] = None
    complaints_duration: Optional[str] = None

    # Treatment Goals
    goal_short_term: Optional[str] = None
    goal_long_term: Optional[str] = None

    # Clinical Form
    problem_statement: Optional[str] = None
    underlying_causes: Optional[str] = None
    smart_goal_1: Optional[str] = None
    smart_goal_1_sub: Optional[str] = None
    smart_goal_2: Optional[str] = None
    smart_goal_2_sub: Optional[str] = None
    smart_goal_3: Optional[str] = None
    smart_goal_3_sub: Optional[str] = None
    treatment_approaches: Optional[str] = None

    updated_at: datetime = Field(default_factory=ist_now)
