from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select
from database import get_session
from models import User, Role, Task, CaregiverPatient, Notification, CaregiverNote, MoodEntry, Billing, Appointment, MediaUpload, LinkageCode
from pydantic import BaseModel
from datetime import datetime, timedelta
import jwt

router = APIRouter(prefix="/api/admin", tags=["admin"])

# Hardcoded admin credentials
ADMIN_EMAIL = "otease2025@gmail.com"
ADMIN_PASSWORD = "OTEASE0703"
ADMIN_SECRET = "admin_secret_key_otease_2025"

class AdminLogin(BaseModel):
    email: str
    password: str

def verify_admin_token(token: str):
    try:
        payload = jwt.decode(token, ADMIN_SECRET, algorithms=["HS256"])
        if payload.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Not an admin token")
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/login")
def admin_login(data: AdminLogin):
    if data.email != ADMIN_EMAIL or data.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
    
    token = jwt.encode(
        {"role": "admin", "exp": datetime.utcnow() + timedelta(hours=8)},
        ADMIN_SECRET,
        algorithm="HS256"
    )
    return {"token": token, "message": "Admin login successful"}

@router.get("/users")
def get_all_users(token: str, session: Session = Depends(get_session)):
    verify_admin_token(token)
    
    # 1. Therapists — include full patients list with caregiver names per patient
    therapists = session.exec(select(User).where(User.role == Role.THERAPIST)).all()
    therapist_list = []
    for therapist in therapists:
        th_patients = session.exec(select(User).where(User.therapist_id == therapist.id, User.role == Role.PATIENT)).all()
        patients_data = []
        for p in th_patients:
            cg_links = session.exec(select(CaregiverPatient).where(CaregiverPatient.patient_id == p.id)).all()
            cg_names = []
            for link in cg_links:
                cg = session.get(User, link.caregiver_id)
                if cg:
                    cg_names.append(cg.name or cg.email)
            patients_data.append({
                "name": p.name or p.email,
                "caregivers": cg_names
            })
        therapist_list.append({
            "id": therapist.id,
            "name": therapist.name,
            "email": therapist.email,
            "patient_count": len(th_patients),
            "patients": patients_data
        })
        
    # 2. Patients — include therapist name and caregivers list
    all_patients = session.exec(select(User).where(User.role == Role.PATIENT)).all()
    patient_list = []
    for patient in all_patients:
        therapist = session.get(User, patient.therapist_id) if patient.therapist_id else None
        caregiver_links = session.exec(select(CaregiverPatient).where(CaregiverPatient.patient_id == patient.id)).all()
        caregivers = [session.get(User, link.caregiver_id) for link in caregiver_links]
        caregivers = [c for c in caregivers if c]
        
        patient_list.append({
            "id": patient.id,
            "name": patient.name,
            "email": patient.email,
            "therapist_name": therapist.name if therapist else None,
            "caregiver_count": len(caregivers),
            "caregivers": [{"name": c.name, "email": c.email} for c in caregivers]
        })
        
    # 3. Caregivers — include patients list with therapist_name per patient
    caregivers = session.exec(select(User).where(User.role == Role.CAREGIVER)).all()
    caregiver_list = []
    for caregiver in caregivers:
        patient_links = session.exec(select(CaregiverPatient).where(CaregiverPatient.caregiver_id == caregiver.id)).all()
        patients_linked = [session.get(User, link.patient_id) for link in patient_links]
        patients_linked = [p for p in patients_linked if p]
        
        patients_data = []
        for p in patients_linked:
            th = session.get(User, p.therapist_id) if p.therapist_id else None
            patients_data.append({
                "name": p.name or p.email,
                "therapist_name": th.name or th.email if th else "None"
            })
        
        caregiver_list.append({
            "id": caregiver.id,
            "name": caregiver.name,
            "email": caregiver.email,
            "patient_count": len(patients_linked),
            "patients": patients_data
        })

    return {
        "therapists": therapist_list,
        "patients": patient_list,
        "caregivers": caregiver_list
    }

@router.delete("/therapists/{therapist_id}")
def remove_therapist(therapist_id: str, token: str, session: Session = Depends(get_session)):
    verify_admin_token(token)
    
    therapist = session.get(User, therapist_id)
    if not therapist or therapist.role.value != Role.THERAPIST.value:
        raise HTTPException(status_code=404, detail="Therapist not found")
    
    # Cascade delete patients
    patients = session.exec(
        select(User).where(User.therapist_id == therapist_id)
    ).all()
    
    deleted_patients = []
    for patient in patients:
        if patient.role.value != Role.PATIENT.value:
            continue
        # Delete tasks, notifications, appointments, billing, mood, media
        tasks = session.exec(select(Task).where(Task.assigned_to_id == patient.id)).all()
        for t in tasks: session.delete(t)
        
        notifs = session.exec(select(Notification).where(Notification.user_id == patient.id)).all()
        for n in notifs: session.delete(n)
            
        appts = session.exec(select(Appointment).where(Appointment.patient_id == patient.id)).all()
        for a in appts: session.delete(a)
            
        bills = session.exec(select(Billing).where(Billing.patient_id == patient.id)).all()
        for b in bills: session.delete(b)
            
        moods = session.exec(select(MoodEntry).where(MoodEntry.user_id == patient.id)).all()
        for m in moods: session.delete(m)
            
        media = session.exec(select(MediaUpload).where(MediaUpload.patient_id == patient.id)).all()
        for m in media: session.delete(m)
        
        # Unlink caregivers
        cp_links = session.exec(select(CaregiverPatient).where(CaregiverPatient.patient_id == patient.id)).all()
        for link in cp_links: session.delete(link)
        
        deleted_patients.append(patient.name or patient.email)
        session.delete(patient)
    
    # Delete therapist tasks assigned to others  
    t_tasks = session.exec(select(Task).where(Task.assigned_by_id == therapist_id)).all()
    for t in t_tasks: session.delete(t)
    
    # Delete therapist notifications
    t_notifs = session.exec(select(Notification).where(Notification.user_id == therapist_id)).all()
    for n in t_notifs: session.delete(n)
    
    # Delete linkage codes (CRITICAL: FK constraint will block deletion otherwise)
    linkage_codes = session.exec(select(LinkageCode).where(LinkageCode.therapist_id == therapist_id)).all()
    for lc in linkage_codes: session.delete(lc)
    
    # Delete therapist appointments
    t_appts = session.exec(select(Appointment).where(Appointment.therapist_id == therapist_id)).all()
    for a in t_appts: session.delete(a)
    
    session.flush()  # flush deletions before deleting the therapist user
    session.delete(therapist)
    session.commit()
    return {"message": "Therapist and associated patients removed"}

@router.delete("/patients/{patient_id}")
def remove_patient(patient_id: str, token: str, session: Session = Depends(get_session)):
    verify_admin_token(token)
    
    patient = session.get(User, patient_id)
    if not patient or patient.role.value != Role.PATIENT.value:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    tasks = session.exec(select(Task).where(Task.assigned_to_id == patient.id)).all()
    for t in tasks: session.delete(t)
    
    notifs = session.exec(select(Notification).where(Notification.user_id == patient.id)).all()
    for n in notifs: session.delete(n)
        
    appts = session.exec(select(Appointment).where(Appointment.patient_id == patient.id)).all()
    for a in appts: session.delete(a)
        
    bills = session.exec(select(Billing).where(Billing.patient_id == patient.id)).all()
    for b in bills: session.delete(b)
        
    moods = session.exec(select(MoodEntry).where(MoodEntry.user_id == patient.id)).all()
    for m in moods: session.delete(m)
        
    media = session.exec(select(MediaUpload).where(MediaUpload.patient_id == patient.id)).all()
    for m in media: session.delete(m)
        
    notes = session.exec(select(CaregiverNote).where(CaregiverNote.patient_id == patient.id)).all()
    for n in notes: session.delete(n)
    
    cp_links = session.exec(select(CaregiverPatient).where(CaregiverPatient.patient_id == patient.id)).all()
    for link in cp_links: session.delete(link)
    
    session.delete(patient)
    session.commit()
    return {"message": "Patient removed"}

@router.delete("/caregivers/{caregiver_id}")
def remove_caregiver(caregiver_id: str, token: str, session: Session = Depends(get_session)):
    verify_admin_token(token)
    
    caregiver = session.get(User, caregiver_id)
    if not caregiver or caregiver.role.value != Role.CAREGIVER.value:
        raise HTTPException(status_code=404, detail="Caregiver not found")
        
    notifs = session.exec(select(Notification).where(Notification.user_id == caregiver_id)).all()
    for n in notifs: session.delete(n)
        
    notes = session.exec(select(CaregiverNote).where(CaregiverNote.author_id == caregiver_id)).all()
    for n in notes: session.delete(n)
        
    cp_links = session.exec(select(CaregiverPatient).where(CaregiverPatient.caregiver_id == caregiver_id)).all()
    for link in cp_links: session.delete(link)
    
    session.delete(caregiver)
    session.commit()
    return {"message": "Caregiver removed"}

@router.get("/stats")
def get_stats(token: str, period: str = "weekly", session: Session = Depends(get_session)):
    verify_admin_token(token)
    
    now = datetime.utcnow()
    all_tasks = session.exec(select(Task)).all()
    total_assigned = len(all_tasks)
    total_completed = len([t for t in all_tasks if t.is_completed])
    
    if period == "daily":
        days = 7
        labels = []
        assigned_data = []
        completed_data = []
        for i in range(days - 1, -1, -1):
            day = now - timedelta(days=i)
            day_str = day.strftime("%Y-%m-%d")
            label = day.strftime("%a")
            day_tasks = [t for t in all_tasks if t.scheduled_date == day_str]
            labels.append(label)
            assigned_data.append(len(day_tasks))
            completed_data.append(len([t for t in day_tasks if t.is_completed]))
    elif period == "monthly":
        labels = []
        assigned_data = []
        completed_data = []
        for i in range(5, -1, -1):
            d = datetime(now.year, now.month, 1) - timedelta(days=i * 30)
            month_str = d.strftime("%b")
            month_num = d.month
            year_num = d.year
            month_tasks = [
                t for t in all_tasks
                if t.scheduled_date and
                datetime.strptime(t.scheduled_date, "%Y-%m-%d").month == month_num and
                datetime.strptime(t.scheduled_date, "%Y-%m-%d").year == year_num
            ]
            labels.append(month_str)
            assigned_data.append(len(month_tasks))
            completed_data.append(len([t for t in month_tasks if t.is_completed]))
    else:  # weekly
        labels = []
        assigned_data = []
        completed_data = []
        for i in range(3, -1, -1):
            week_start = now - timedelta(weeks=i, days=now.weekday())
            week_end = week_start + timedelta(days=6)
            label = f"W{4-i}"
            week_tasks = [
                t for t in all_tasks
                if t.scheduled_date and
                week_start.strftime("%Y-%m-%d") <= t.scheduled_date <= week_end.strftime("%Y-%m-%d")
            ]
            labels.append(label)
            assigned_data.append(len(week_tasks))
            completed_data.append(len([t for t in week_tasks if t.is_completed]))
    
    return {
        "total_assigned": total_assigned,
        "total_completed": total_completed,
        "therapist_count": len(session.exec(select(User).where(User.role == Role.THERAPIST)).all()),
        "patient_count": len(session.exec(select(User).where(User.role == Role.PATIENT)).all()),
        "caregiver_count": len(session.exec(select(User).where(User.role == Role.CAREGIVER)).all()),
        "chart": {
            "labels": labels,
            "assigned": assigned_data,
            "completed": completed_data
        }
    }
