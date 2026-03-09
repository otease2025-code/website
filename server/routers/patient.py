from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from database import get_session
from models import User, Role, Task, MoodEntry, Billing, LinkageCode, CaregiverPatient
from typing import List
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel
from routers.notifications import create_notification

router = APIRouter(prefix="/api/patient", tags=["patient"])
class TaskCompletion(BaseModel):
    is_completed: bool
    proof_media_id: str | None = None
# IST timezone offset (+5:30)
IST = timezone(timedelta(hours=5, minutes=30))


class MoodSubmission(BaseModel):
    mood_score: int
    primary_emotion: str | None = None
    secondary_emotion: str | None = None
    tertiary_emotion: str | None = None
    journal_text: str | None = None

@router.get("/tasks", response_model=List[Task])
def get_tasks(user_id: str, session: Session = Depends(get_session)):
    statement = select(Task).where(Task.assigned_to_id == user_id)
    tasks = session.exec(statement).all()
    return tasks

@router.post("/mood", status_code=status.HTTP_201_CREATED)
def submit_mood(user_id: str, mood_data: MoodSubmission, session: Session = Depends(get_session)):
    mood_entry = MoodEntry(
        user_id=user_id,
        mood_score=mood_data.mood_score,
        primary_emotion=mood_data.primary_emotion,
        secondary_emotion=mood_data.secondary_emotion,
        tertiary_emotion=mood_data.tertiary_emotion,
        journal_text=mood_data.journal_text
    )
    session.add(mood_entry)
    session.commit()

    # Notify therapist about new mood log
    patient = session.get(User, user_id)
    if patient and patient.therapist_id:
        p_name = patient.name or "Patient"
        detail = " (with journal entry)" if mood_data.journal_text else ""
        create_notification(
            session, patient.therapist_id, "patient",
            "New Patient Log",
            f"{p_name} submitted a mood entry (score: {mood_data.mood_score}){detail}"
        )
        session.commit()

    return {"message": "Mood submitted successfully"}

@router.get("/mood/history", response_model=List[MoodEntry])
def get_mood_history(user_id: str, session: Session = Depends(get_session)):
    statement = select(MoodEntry).where(MoodEntry.user_id == user_id).order_by(MoodEntry.created_at.desc()).limit(5)
    moods = session.exec(statement).all()
    return moods

@router.get("/billing")
def get_billing_status(user_id: str, session: Session = Depends(get_session)):
    statement = select(Billing).where(Billing.patient_id == user_id).order_by(Billing.created_at.desc())
    bills = session.exec(statement).all()
    
    total_billed = sum(b.amount for b in bills)
    total_paid = sum(b.amount for b in bills if b.status == "PAID")
    outstanding = total_billed - total_paid
    
    bills_list = []
    for b in bills:
        bills_list.append({
            "id": b.id,
            "description": b.description or "Therapy Session",
            "amount": b.amount,
            "date": b.created_at.strftime("%b %d, %Y"),
            "status": b.status.lower(),
            "payment_method": b.payment_method,
        })
    
    return {
        "total": total_billed,
        "paid": total_paid,
        "outstanding": outstanding,
        "bills": bills_list
    }

@router.get("/caregiver-code")
def get_caregiver_code(user_id: str, session: Session = Depends(get_session)):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if not user.caregiver_code:
        import random, string
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        while session.exec(select(User).where(User.caregiver_code == code)).first():
            code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        
        user.caregiver_code = code
        session.add(user)
        session.commit()
        session.refresh(user)
        print(f"DEBUG: Generated/Saved caregiver code '{code}' for user {user_id}")
        
    return {"code": user.caregiver_code}

@router.put("/tasks/{task_id}")
def complete_task(task_id: str, completion: TaskCompletion, session: Session = Depends(get_session)):
    # 1. Fetch the task from the database
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # 2. IST time-window validation
    if completion.is_completed and not completion.proof_media_id:
        now_ist = datetime.now(IST)
        try:
            task_date = datetime.strptime(task.scheduled_date, "%Y-%m-%d").date()
            start_parts = task.start_time.split(":")
            end_parts = task.end_time.split(":")
            
            task_start = datetime(
                task_date.year, task_date.month, task_date.day,
                int(start_parts[0]), int(start_parts[1]), tzinfo=IST
            )
            task_end = datetime(
                task_date.year, task_date.month, task_date.day,
                int(end_parts[0]), int(end_parts[1]), tzinfo=IST
            ) + timedelta(minutes=5)
            
            if now_ist < task_start:
                raise HTTPException(
                    status_code=400,
                    detail=f"Task is not yet available. It starts at {task.start_time} IST."
                )
            if now_ist > task_end:
                raise HTTPException(
                    status_code=400,
                    detail="Task completion window has expired. This task is now overdue."
                )
        except ValueError:
            pass
    
    # 3. Update the database object
    task.is_completed = completion.is_completed
    if completion.proof_media_id is not None:
        task.proof_media_id = completion.proof_media_id
        
    # 4. Save changes to RDS
    session.add(task)
    session.commit()
    session.refresh(task)

    # ── Notify linked caregivers ──────────────────────────────────
    if completion.is_completed:
        links = session.exec(
            select(CaregiverPatient).where(
                CaregiverPatient.patient_id == task.assigned_to_id
            )
        ).all()
        patient = session.get(User, task.assigned_to_id)
        patient_name = patient.name if patient else "Patient"
        for link in links:
            create_notification(
                session,
                link.caregiver_id,
                "task",
                "✅ Verification Needed",
                f'{patient_name} completed "{task.title}" — tap to verify'
            )
        session.commit()
    # ─────────────────────────────────────────────────────────────

    return {
        "status": "success",
        "message": "Task updated",
        "is_completed": task.is_completed,
        "proof_media_id": task.proof_media_id
    }
    
class LinkTherapistRequest(BaseModel):
    code: str

@router.post("/link-therapist")
def link_therapist(link_data: LinkTherapistRequest, user_id: str, session: Session = Depends(get_session)):
    linkage = session.exec(select(LinkageCode).where(LinkageCode.code == link_data.code)).first()
    if not linkage:
        raise HTTPException(status_code=404, detail="Invalid linkage code")
    
    if linkage.expires_at < datetime.now(IST).replace(tzinfo=None):
        raise HTTPException(status_code=400, detail="Linkage code expired")
    
    patient = session.get(User, user_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    patient.therapist_id = linkage.therapist_id
    session.add(patient)
    session.commit()
    
    therapist = session.get(User, linkage.therapist_id)
    return {"message": "Successfully linked to therapist", "therapist_name": therapist.name if therapist else "Therapist"}
