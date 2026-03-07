from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlmodel import Session, select
from database import get_session
from models import User, Role, LinkageCode, Task, MoodEntry, Billing, Appointment, MediaUpload, CaregiverPatient, PatientProfile
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel
import uuid
import asyncio
from routers.notifications import create_notification, send_push_notification

router = APIRouter(prefix="/api/therapist", tags=["therapist"])

IST = timezone(timedelta(hours=5, minutes=30))

# ─── Background Helpers For Patient Reminders ──────────────────────────────────

async def schedule_start_warning(patient_id: str, task_title: str, scheduled_date: str, start_time_str: str):
    try:
        start_dt_str = f"{scheduled_date} {start_time_str}"
        start_time = datetime.strptime(start_dt_str, "%Y-%m-%d %H:%M")
        warning_time = start_time - timedelta(minutes=5)

        # FIX: Use IST-aware now, then strip tzinfo for consistent naive comparison
        now = datetime.now(IST).replace(tzinfo=None)
        seconds_to_wait = (warning_time - now).total_seconds()

        print(f"[REMINDER] Start warning for '{task_title}' fires in {seconds_to_wait:.0f}s")

        if seconds_to_wait > 0:
            await asyncio.sleep(seconds_to_wait)
            await send_push_notification(
                user_id=patient_id,
                title="Task Starting Soon! 🔔",
                body=f"Your task '{task_title}' starts in 5 minutes."
            )
        else:
            print(f"[REMINDER] Start warning skipped — task already passed")
    except Exception as e:
        print(f"[ERROR] Start reminder failed: {e}")


async def schedule_deadline_warning(patient_id: str, task_title: str, scheduled_date: str, end_time_str: str):
    try:
        end_dt_str = f"{scheduled_date} {end_time_str}"
        end_time = datetime.strptime(end_dt_str, "%Y-%m-%d %H:%M")
        warning_time = end_time - timedelta(minutes=5)

        # FIX: Same IST-consistent naive datetime
        now = datetime.now(IST).replace(tzinfo=None)
        seconds_to_wait = (warning_time - now).total_seconds()

        print(f"[REMINDER] Deadline warning for '{task_title}' fires in {seconds_to_wait:.0f}s")

        if seconds_to_wait > 0:
            await asyncio.sleep(seconds_to_wait)
            await send_push_notification(
                user_id=patient_id,
                title="Task Ending Soon! ⏳",
                body=f"Hurry! Only 5 minutes left to finish: {task_title}"
            )
        else:
            print(f"[REMINDER] Deadline warning skipped — task already ended")
    except Exception as e:
        print(f"[ERROR] Deadline reminder failed: {e}")
# ─── Pydantic Models ──────────────────────────────────────────────────────────

class TaskAssign(BaseModel):
    title: str
    description: str | None = None
    patient_id: str
    scheduled_date: str
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
    status: str = "PENDING"
    payment_method: Optional[str] = None

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    specialization: Optional[str] = None
    license_number: Optional[str] = None
    experience: Optional[str] = None
    certification: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

class PatientProfileUpdate(BaseModel):
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
    complaints_subjective: Optional[str] = None
    complaints_objective: Optional[str] = None
    complaints_duration: Optional[str] = None
    goal_short_term: Optional[str] = None
    goal_long_term: Optional[str] = None
    problem_statement: Optional[str] = None
    underlying_causes: Optional[str] = None
    smart_goal_1: Optional[str] = None
    smart_goal_1_sub: Optional[str] = None
    smart_goal_2: Optional[str] = None
    smart_goal_2_sub: Optional[str] = None
    smart_goal_3: Optional[str] = None
    smart_goal_3_sub: Optional[str] = None
    treatment_approaches: Optional[str] = None

# ─── Routes ───────────────────────────────────────────────────────────────────

@router.post("/linkage-code")
def generate_linkage_code(therapist_id: str, session: Session = Depends(get_session)):
    therapist = session.get(User, therapist_id)
    if not therapist: raise HTTPException(status_code=404, detail="Therapist not found")
    if therapist.role != Role.THERAPIST: raise HTTPException(status_code=400, detail="User is not a therapist")
    code = str(uuid.uuid4())[:8]
    expires_at = datetime.now(IST).replace(tzinfo=None) + timedelta(hours=12)
    try:
        linkage = LinkageCode(code=code, therapist_id=therapist_id, expires_at=expires_at, is_used=False, patient_linked=False, caregiver_linked=False)
        session.add(linkage); session.commit(); session.refresh(linkage)
        return {"code": code, "expires_at": expires_at.isoformat()}
    except Exception: session.rollback(); raise HTTPException(status_code=500, detail="Failed to generate code")

@router.get("/patients")
def get_patients(therapist_id: str, session: Session = Depends(get_session)):
    patients = session.exec(select(User).where(User.therapist_id == therapist_id, User.role == Role.PATIENT)).all()
    result = []
    for p in patients:
        links = session.exec(select(CaregiverPatient).where(CaregiverPatient.patient_id == p.id)).all()
        caregiver_names = []
        for link in links:
            c = session.get(User, link.caregiver_id)
            if c: caregiver_names.append(c.name or c.email)
        result.append({"id": p.id, "email": p.email, "name": p.name, "role": p.role.value, "caregiver_code": p.caregiver_code, "therapist_id": p.therapist_id, "createdAt": p.createdAt.isoformat() if p.createdAt else None, "caregivers": caregiver_names})
    return result

@router.post("/tasks", status_code=status.HTTP_201_CREATED)
def assign_task(therapist_id: str, task_data: TaskAssign, background_tasks: BackgroundTasks, session: Session = Depends(get_session)):
    task = Task(title=task_data.title, description=task_data.description, assigned_to_id=task_data.patient_id, assigned_by_id=therapist_id, scheduled_date=task_data.scheduled_date, start_time=task_data.start_time, end_time=task_data.end_time, task_type=task_data.task_type)
    session.add(task); session.commit()
    background_tasks.add_task(schedule_start_warning, task_data.patient_id, task_data.title, task_data.scheduled_date, task_data.start_time)
    background_tasks.add_task(schedule_deadline_warning, task_data.patient_id, task_data.title, task_data.scheduled_date, task_data.end_time)
    return {"message": "Task assigned successfully with both reminders scheduled"}

@router.get("/patients/logs")
def get_all_patient_logs(therapist_id: str, session: Session = Depends(get_session)):
    patients = session.exec(select(User).where(User.therapist_id == therapist_id, User.role == Role.PATIENT)).all()
    ids = [p.id for p in patients]
    if not ids: return []
    logs = session.exec(select(MoodEntry).where(MoodEntry.user_id.in_(ids)).order_by(MoodEntry.created_at.desc())).all()
    # Explicit formatting to match therapist dashboard expectations
    result = []
    for log in logs:
        p = session.get(User, log.user_id)
        result.append({
            "id": log.id,
            "patient_id": log.user_id,
            "patient_name": p.name if p else "Unknown",
            "timestamp": log.created_at.isoformat(),
            "mood_score": log.mood_score,
            "emotions": [e for e in [log.primary_emotion, log.secondary_emotion, log.tertiary_emotion] if e],
            "journal_text": log.journal_text or ""
        })
    return result
# In therapist.py — update create_appointment
@router.post("/appointments")
def create_appointment(therapist_id: str, appt_data: AppointmentCreate, session: Session = Depends(get_session)):
    dt = appt_data.datetime.replace(tzinfo=None)
    appt = Appointment(therapist_id=therapist_id, patient_id=appt_data.patient_id, datetime=dt, is_recurring=appt_data.is_recurring)
    session.add(appt)
    session.commit()

    # FIX: Convert stored UTC to IST for display in notification
    ist_offset = timedelta(hours=5, minutes=30)
    dt_ist = dt + ist_offset
    create_notification(
        session, appt_data.patient_id, "appointment",
        "New Appointment Scheduled",
        f"Appointment on {dt_ist.strftime('%b %d, %I:%M %p')} IST"
    )
    session.commit()
    return {"message": "Appointment created"}

# Also fix get_appointments to return IST time
@router.get("/appointments")
def get_appointments(therapist_id: str, session: Session = Depends(get_session)):
    appointments = session.exec(
        select(Appointment).where(Appointment.therapist_id == therapist_id)
    ).all()
    ist_offset = timedelta(hours=5, minutes=30)
    result = []
    for appt in appointments:
        dt_ist = appt.datetime + ist_offset
        result.append({
            "id": appt.id,
            "patient_id": appt.patient_id,
            "datetime": dt_ist.isoformat(),          # IST time sent to frontend
            "datetime_display": dt_ist.strftime("%b %d, %Y %I:%M %p"),
            "is_recurring": appt.is_recurring
        })
    return result

def get_patient_progress(patient_id: str, session: Session = Depends(get_session)):
    tasks = session.exec(select(Task).where(Task.assigned_to_id == patient_id)).all()
    total_tasks = len(tasks)
    completed = sum(1 for t in tasks if t.is_completed and t.verified_by_caregiver)
    completion_rate = round((completed / total_tasks * 100), 1) if total_tasks > 0 else 0
    verified_media = []
    for task in tasks:
        if task.verified_by_caregiver and task.proof_media_id:
            media = session.get(MediaUpload, task.proof_media_id)
            if media:
                verified_media.append({
                    "id": media.id,
                    "task_title": task.title,
                    "file_url": f"/api/uploads/file/{media.id}",
                    "file_type": media.file_type or "video/mp4"
                })
    return {"total_tasks": total_tasks, "completed": completed, "completion_rate": completion_rate, "verified_media": verified_media}

# ... (Keep /billing, /appointments, /profile exactly as they are)

@router.get("/profile")
def get_profile(therapist_id: str, session: Session = Depends(get_session)):
    user = session.get(User, therapist_id)
    if not user or user.role != Role.THERAPIST: raise HTTPException(status_code=404, detail="Therapist not found")
    return user

@router.put("/profile")
def update_profile(therapist_id: str, data: ProfileUpdate, session: Session = Depends(get_session)):
    user = session.get(User, therapist_id)
    if not user or user.role != Role.THERAPIST: raise HTTPException(status_code=404, detail="Therapist not found")
    for key, value in data.dict(exclude_unset=True).items(): setattr(user, key, value)
    user.updatedAt = datetime.now(IST).replace(tzinfo=None)
    session.add(user); session.commit()
    return {"message": "Profile updated"}

@router.get("/patients/{patient_id}/profile")
def get_patient_profile(patient_id: str, session: Session = Depends(get_session)):
    return session.exec(select(PatientProfile).where(PatientProfile.patient_id == patient_id)).first() or {}

@router.put("/patients/{patient_id}/profile")
def upsert_patient_profile(patient_id: str, data: PatientProfileUpdate, session: Session = Depends(get_session)):
    profile = session.exec(select(PatientProfile).where(PatientProfile.patient_id == patient_id)).first()
    if not profile:
        profile = PatientProfile(patient_id=patient_id); session.add(profile)
    for key, value in data.dict(exclude_unset=True).items(): setattr(profile, key, value)
    session.commit()
    return {"message": "Patient profile saved"}
# ─── Standardized Billing Routes ──────────────────────────────────────────────

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

@router.get("/patients/{patient_id}/tasks")
def get_patient_tasks_therapist(patient_id: str, session: Session = Depends(get_session)):
    tasks = session.exec(
        select(Task).where(Task.assigned_to_id == patient_id)
        .order_by(Task.scheduled_date.desc())
    ).all()
    return [{
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "scheduled_date": task.scheduled_date,
        "start_time": task.start_time,
        "end_time": task.end_time,
        "task_type": task.task_type,
        "is_completed": task.is_completed,
        "verified_by_caregiver": task.verified_by_caregiver,
        "proof_media_id": task.proof_media_id,
    } for task in tasks]


@router.get("/patients/{patient_id}/report")
def get_patient_report(patient_id: str, session: Session = Depends(get_session)):
    tasks = session.exec(select(Task).where(Task.assigned_to_id == patient_id)).all()

    ADL_TYPES = {"adl_scheduling", "adl", "daily routines", "Daily Routines"}
    adl_total = adl_done = task_total = task_done = 0

    monthly_data: dict = {}
    now = datetime.now(IST).replace(tzinfo=None)
    for i in range(5, -1, -1):
        d = now - timedelta(days=30 * i)
        monthly_data[d.strftime("%b '%y")] = {"completed": 0, "total": 0}

    for task in tasks:
        ttype = (task.task_type or "").strip()
        is_adl = ttype in ADL_TYPES
        completed = task.is_completed and task.verified_by_caregiver

        if is_adl:
            adl_total += 1
            if completed: adl_done += 1
        else:
            task_total += 1
            if completed: task_done += 1

        if task.scheduled_date:
            try:
                td = datetime.strptime(task.scheduled_date, "%Y-%m-%d")
                mk = td.strftime("%b '%y")
                if mk in monthly_data:
                    monthly_data[mk]["total"] += 1
                    if completed:
                        monthly_data[mk]["completed"] += 1
            except:
                pass

    media_list = []
    for task in tasks:
        if task.proof_media_id:
            media = session.get(MediaUpload, task.proof_media_id)
            if media:
                media_list.append({
                    "id": media.id,
                    "task_title": task.title,
                    "task_category": task.task_type or "General",
                    "file_url": f"/api/uploads/file/{media.id}",
                    "file_type": media.file_type or "video/mp4",
                    "task_date": task.scheduled_date,
                    "verified": task.verified_by_caregiver,
                })

    total_tasks = len(tasks)
    total_completed = adl_done + task_done

    return {
        "total_tasks": total_tasks,
        "total_completed": total_completed,
        "completion_rate": round((total_completed / total_tasks * 100), 1) if total_tasks > 0 else 0,
        "category_breakdown": [
            {"category": "ADL Scheduling", "completed": adl_done, "not_completed": adl_total - adl_done, "total": adl_total},
            {"category": "Task Assignment", "completed": task_done, "not_completed": task_total - task_done, "total": task_total},
        ],
        "monthly_completion": [
            {"month": m, "completed": v["completed"], "total": v["total"]}
            for m, v in monthly_data.items()
        ],
        "media": media_list,
    }
