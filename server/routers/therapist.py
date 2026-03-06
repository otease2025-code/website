from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from database import get_session
from models import User, Role, LinkageCode, Task, MoodEntry, Billing, Appointment, MediaUpload, CaregiverPatient, PatientProfile
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel
import uuid
from routers.notifications import create_notification

router = APIRouter(prefix="/api/therapist", tags=["therapist"])

IST = timezone(timedelta(hours=5, minutes=30))

class TaskAssign(BaseModel):
    title: str
    description: str | None = None
    patient_id: str
    scheduled_date: str  # YYYY-MM-DD format
    start_time: str
    end_time: str
    task_type: str = "general"

class AppointmentCreate(BaseModel):
    patient_id: str
    datetime: datetime
    is_recurring: bool = False

class BillingCreate(BaseModel):
    patient_id: str
    description: Optional[str] = None
    amount: float
    status: str = "PENDING"  # PENDING or PAID
    payment_method: Optional[str] = None  # Cash, UPI, Card, Cheque

@router.post("/linkage-code")
def generate_linkage_code(therapist_id: str, session: Session = Depends(get_session)):
    # Verify therapist exists
    therapist = session.get(User, therapist_id)
    if not therapist:
        raise HTTPException(status_code=404, detail="Therapist not found")
    if therapist.role != Role.THERAPIST:
        raise HTTPException(status_code=400, detail="User is not a therapist")
    
    # Generate a unique code
    code = str(uuid.uuid4())[:8] # Simple 8 char code
    expires_at = datetime.now(IST).replace(tzinfo=None) + timedelta(hours=12)
    
    try:
        linkage = LinkageCode(
            code=code,
            therapist_id=therapist_id,
            expires_at=expires_at,
            is_used=False,
            patient_linked=False,
            caregiver_linked=False
        )
        session.add(linkage)
        session.commit()
        session.refresh(linkage)
        return {"code": code, "expires_at": expires_at.isoformat()}
    except Exception as e:
        session.rollback()
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error creating linkage code: {error_trace}")
        raise HTTPException(status_code=500, detail=f"Failed to generate code: {str(e)}")

@router.get("/patients")
def get_patients(therapist_id: str, session: Session = Depends(get_session)):
    print(f"[DEBUG] GET /patients called with therapist_id: {therapist_id!r}")
    statement = select(User).where(User.therapist_id == therapist_id).where(User.role == Role.PATIENT)
    patients = session.exec(statement).all()
    print(f"[DEBUG] Found {len(patients)} patients for therapist {therapist_id!r}")
    
    result = []
    for patient in patients:
        # Get caregivers linked to this patient
        links = session.exec(select(CaregiverPatient).where(CaregiverPatient.patient_id == patient.id)).all()
        caregiver_names = []
        for link in links:
            c = session.get(User, link.caregiver_id)
            if c:
                caregiver_names.append(c.name or c.email)
        
        patient_data = {
            "id": patient.id,
            "email": patient.email,
            "name": patient.name,
            "role": patient.role.value,  # Returns "PATIENT" not "Role.PATIENT"
            "caregiver_code": patient.caregiver_code,
            "therapist_id": patient.therapist_id,
            "createdAt": patient.createdAt.isoformat() if patient.createdAt else None,
            "caregivers": caregiver_names
        }
        result.append(patient_data)
        
    return result

@router.post("/tasks", status_code=status.HTTP_201_CREATED)
def assign_task(therapist_id: str, task_data: TaskAssign, session: Session = Depends(get_session)):
    task = Task(
        title=task_data.title,
        description=task_data.description,
        assigned_to_id=task_data.patient_id,
        assigned_by_id=therapist_id,
        scheduled_date=task_data.scheduled_date,
        start_time=task_data.start_time,
        end_time=task_data.end_time,
        task_type=task_data.task_type
    )
    session.add(task)
    session.commit()
    return {"message": "Task assigned successfully"}

@router.post("/billing/confirm")
def confirm_billing(therapist_id: str, billing_data: BillingCreate, session: Session = Depends(get_session)):
    billing = Billing(
        patient_id=billing_data.patient_id,
        therapist_id=therapist_id,
        description=billing_data.description,
        amount=billing_data.amount,
        status=billing_data.status.upper(),
        payment_method=billing_data.payment_method,
        transaction_date=datetime.now(IST).replace(tzinfo=None)
    )
    session.add(billing)
    session.commit()
    session.refresh(billing)

    # Notification for patient
    create_notification(
        session, billing_data.patient_id, "billing",
        "New Billing",
        f"New bill of ₹{billing_data.amount:.0f} from your therapist" +
        (f" — {billing_data.description}" if billing_data.description else "")
    )
    session.commit()

    return {"message": "Billing recorded successfully"}

@router.get("/patients/{patient_id}/billing")
def get_patient_billing(patient_id: str, session: Session = Depends(get_session)):
    """Get billing records for a specific patient"""
    bills = session.exec(
        select(Billing).where(Billing.patient_id == patient_id).order_by(Billing.created_at.desc())
    ).all()
    
    total_billed = sum(b.amount for b in bills)
    total_paid = sum(b.amount for b in bills if b.status == "PAID")
    outstanding = total_billed - total_paid
    
    bills_list = []
    for b in bills:
        therapist = session.get(User, b.therapist_id)
        bills_list.append({
            "id": b.id,
            "description": b.description or "Therapy Session",
            "amount": b.amount,
            "date": b.created_at.strftime("%b %d, %Y"),
            "status": b.status.lower(),
            "payment_method": b.payment_method,
            "added_by": therapist.name if therapist else "Therapist"
        })
    
    return {
        "total": total_billed,
        "paid": total_paid,
        "outstanding": outstanding,
        "bills": bills_list
    }

@router.put("/billing/{billing_id}/pay")
def pay_bill(billing_id: str, payload: dict, session: Session = Depends(get_session)):
    """Mark a pending bill as PAID"""
    billing = session.get(Billing, billing_id)
    if not billing:
        raise HTTPException(status_code=404, detail="Billing record not found")
        
    billing.status = "PAID"
    billing.payment_method = payload.get("payment_method", "Cash")
    billing.transaction_date = datetime.now(IST).replace(tzinfo=None)
    
    session.add(billing)
    session.commit()
    return {"message": "Bill marked as paid"}

@router.get("/patients/{patient_id}/progress")
def get_patient_progress(patient_id: str, session: Session = Depends(get_session)):
    """Get task progress and caregiver-verified media for a patient"""
    tasks = session.exec(select(Task).where(Task.assigned_to_id == patient_id)).all()
    
    total_tasks = len(tasks)
    completed = sum(1 for t in tasks if t.is_completed and t.verified_by_caregiver)
    patient_done = sum(1 for t in tasks if t.is_completed)
    verified = sum(1 for t in tasks if t.verified_by_caregiver)
    completion_rate = round((completed / total_tasks * 100), 1) if total_tasks > 0 else 0
    
    # Get media from caregiver-verified tasks only
    verified_media = []
    for task in tasks:
        if task.verified_by_caregiver and task.proof_media_id:
            media = session.get(MediaUpload, task.proof_media_id)
            if media:
                verified_media.append({
                    "id": media.id,
                    "task_title": task.title,
                    "file_name": media.file_name,
                    "file_type": media.file_type,
                    "file_url": f"/api/uploads/file/{media.id}",
                    "created_at": media.created_at.isoformat()
                })
    
    return {
        "total_tasks": total_tasks,
        "completed": completed,
        "patient_done": patient_done,
        "verified": verified,
        "completion_rate": completion_rate,
        "verified_media": verified_media
    }

@router.post("/appointments")
def create_appointment(therapist_id: str, appt_data: AppointmentCreate, session: Session = Depends(get_session)):
    # Convert incoming datetime to IST naive
    dt = appt_data.datetime
    if dt.tzinfo is not None:
        dt = dt.astimezone(IST).replace(tzinfo=None)
        
    appt = Appointment(
        therapist_id=therapist_id,
        patient_id=appt_data.patient_id,
        datetime=dt,
        is_recurring=appt_data.is_recurring
    )
    session.add(appt)
    session.commit()
    session.refresh(appt)

    # Notifications for both therapist and patient
    patient = session.get(User, appt_data.patient_id)
    therapist = session.get(User, therapist_id)
    p_name = patient.name if patient else "Patient"
    t_name = therapist.name if therapist else "Therapist"
    appt_date_str = dt.strftime("%b %d, %Y at %I:%M %p")

    create_notification(
        session, appt_data.patient_id, "appointment",
        "New Appointment Scheduled",
        f"Appointment with {t_name} on {appt_date_str}"
    )
    create_notification(
        session, therapist_id, "appointment",
        "Appointment Scheduled",
        f"Appointment with {p_name} on {appt_date_str}"
    )
    session.commit()

    return {"message": "Appointment created"}

@router.get("/appointments")
def get_appointments(therapist_id: str, session: Session = Depends(get_session)):
    statement = select(Appointment).where(Appointment.therapist_id == therapist_id)
    appointments = session.exec(statement).all()
    return appointments

@router.get("/patients/logs")
def get_all_patient_logs(therapist_id: str, session: Session = Depends(get_session)):
    """Get logs for ALL patients linked to this therapist"""
    # 1. Get all patients
    patients = session.exec(select(User).where(User.therapist_id == therapist_id, User.role == Role.PATIENT)).all()
    patient_ids = [p.id for p in patients]
    patient_map = {p.id: p for p in patients}

    if not patient_ids:
        return []

    # 2. Get all logs
    logs = session.exec(select(MoodEntry).where(MoodEntry.user_id.in_(patient_ids)).order_by(MoodEntry.created_at.desc())).all()

    # 3. Format
    result = []
    for log in logs:
        patient = patient_map.get(log.user_id)
        result.append({
            "id": log.id,
            "patient_id": log.user_id,
            "patient_name": patient.name if patient else "Unknown",
            "timestamp": log.created_at.isoformat(),
            "mood_score": log.mood_score,
            "emotions": [e for e in [log.primary_emotion, log.secondary_emotion, log.tertiary_emotion] if e],
            "journal_text": log.journal_text
        })
    return result

@router.get("/patients/{patient_id}/logs")
def get_patient_logs(patient_id: str, session: Session = Depends(get_session)):
    statement = select(MoodEntry).where(MoodEntry.user_id == patient_id).order_by(MoodEntry.created_at.desc())
    logs = session.exec(statement).all()
    
    result = []
    for log in logs:
        result.append({
            "id": log.id,
            "timestamp": log.created_at.isoformat(),
            "mood_score": log.mood_score,
            "emotions": [e for e in [log.primary_emotion, log.secondary_emotion, log.tertiary_emotion] if e],
            "journal_text": log.journal_text
        })
    return result

@router.get("/patients/activity-report")
def get_patients_activity_report(therapist_id: str, session: Session = Depends(get_session)):
    """Get metrics and media proofs for ALL patients linked to this therapist"""
    # 1. Get all patients
    patients = session.exec(select(User).where(User.therapist_id == therapist_id, User.role == Role.PATIENT)).all()
    
    if not patients:
        return []

    result = []
    for patient in patients:
        # Get all tasks for this patient
        tasks = session.exec(select(Task).where(Task.assigned_to_id == patient.id)).all()
        
        # Calculate metrics
        total_tasks = len(tasks)
        completed_by_patient = sum(1 for t in tasks if t.is_completed)
        verified_by_caregiver = sum(1 for t in tasks if t.verified_by_caregiver)
        fully_completed = sum(1 for t in tasks if t.is_completed and t.verified_by_caregiver)
        adl_tasks_count = sum(1 for t in tasks if t.task_type == "adl_schedule")
        
        # Get media proofs for ADL tasks specifically
        proof_media = []
        for task in tasks:
            if task.task_type == "adl_schedule" and task.proof_media_id:
                proof = session.get(MediaUpload, task.proof_media_id)
                if proof:
                    proof_media.append({
                        "id": proof.id,
                        "task_title": task.title,
                        "file_name": proof.file_name,
                        "s3_key": proof.s3_key,
                        "file_type": proof.file_type,
                        "is_verified": task.verified_by_caregiver,
                        "created_at": proof.created_at.isoformat()
                    })
        
        result.append({
            "patient_id": patient.id,
            "patient_name": patient.name or patient.email,
            "metrics": {
                "total_tasks": total_tasks,
                "completed_by_patient": completed_by_patient,
                "verified_by_caregiver": verified_by_caregiver,
                "fully_completed": fully_completed,
                "adl_tasks": adl_tasks_count,
                "completion_rate": round((fully_completed / total_tasks * 100), 1) if total_tasks > 0 else 0
            },
            "proof_media": proof_media
        })
        
    return result

@router.get("/patients/{patient_id}/tasks")
def get_patient_tasks(patient_id: str, session: Session = Depends(get_session)):
    statement = select(Task).where(Task.assigned_to_id == patient_id).order_by(Task.created_at.desc())
    tasks = session.exec(statement).all()
    return tasks

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    specialization: Optional[str] = None
    license_number: Optional[str] = None
    experience: Optional[str] = None
    certification: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

@router.get("/profile")
def get_profile(therapist_id: str, session: Session = Depends(get_session)):
    user = session.get(User, therapist_id)
    if not user or user.role != Role.THERAPIST:
        raise HTTPException(status_code=404, detail="Therapist not found")
    return {
        "name": user.name,
        "email": user.email,
        "specialization": user.specialization,
        "license_number": user.license_number,
        "experience": user.experience,
        "certification": user.certification,
        "phone": user.phone,
        "address": user.address
    }

@router.put("/profile")
def update_profile(therapist_id: str, data: ProfileUpdate, session: Session = Depends(get_session)):
    user = session.get(User, therapist_id)
    if not user or user.role != Role.THERAPIST:
        raise HTTPException(status_code=404, detail="Therapist not found")
    
    if data.name is not None: user.name = data.name
    if data.specialization is not None: user.specialization = data.specialization
    if data.license_number is not None: user.license_number = data.license_number
    if data.experience is not None: user.experience = data.experience
    if data.certification is not None: user.certification = data.certification
    if data.phone is not None: user.phone = data.phone
    if data.address is not None: user.address = data.address
    
    user.updatedAt = datetime.now(IST).replace(tzinfo=None)
    session.add(user)
    session.commit()
    
    # Update localStorage data
    return {"message": "Profile updated successfully"}


# ─── Patient Clinical Profile ─────────────────────────────────────────────────

class PatientProfileUpdate(BaseModel):
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

@router.get("/patients/{patient_id}/profile")
def get_patient_profile(patient_id: str, session: Session = Depends(get_session)):
    profile = session.exec(
        select(PatientProfile).where(PatientProfile.patient_id == patient_id)
    ).first()
    if not profile:
        return {}  # Return empty dict so frontend knows there's no data yet
    return profile

@router.put("/patients/{patient_id}/profile")
def upsert_patient_profile(patient_id: str, data: PatientProfileUpdate, session: Session = Depends(get_session)):
    profile = session.exec(
        select(PatientProfile).where(PatientProfile.patient_id == patient_id)
    ).first()

    if not profile:
        profile = PatientProfile(patient_id=patient_id)
        session.add(profile)

    fields = data.dict(exclude_unset=False)
    for key, value in fields.items():
        if value is not None:
            setattr(profile, key, value)

    profile.updated_at = datetime.now(IST).replace(tzinfo=None)
    session.commit()
    session.refresh(profile)
    return {"message": "Patient profile saved", "profile": profile}
