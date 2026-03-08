from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from database import get_session
from models import User, Role, Task, CaregiverNote, CaregiverPatient, MediaUpload
from typing import List
from pydantic import BaseModel
from routers.notifications import create_notification

router = APIRouter(prefix="/api/caregiver", tags=["caregiver"])

class TaskVerification(BaseModel):
    task_id: str
    verified: bool
    notes: str | None = None

@router.get("/tasks")
def get_caregiver_tasks(caregiver_id: str, session: Session = Depends(get_session)):
    """Get all tasks for patients linked to caregiver's therapist"""
    caregiver = session.get(User, caregiver_id)
    # Get linked patients
    links = session.exec(select(CaregiverPatient).where(CaregiverPatient.caregiver_id == caregiver_id)).all()
    patient_ids = [link.patient_id for link in links]
    
    if not patient_ids:
        return []
        
    patients = session.exec(select(User).where(User.id.in_(patient_ids))).all()
    patient_map = {p.id: p for p in patients}
    
    # Get tasks for these patients
    tasks = session.exec(select(Task).where(Task.assigned_to_id.in_(patient_ids))).all()
    
    result = []
    for task in tasks:
        patient = patient_map.get(task.assigned_to_id)
        media_info = {}
        if task.proof_media_id:
            media = session.get(MediaUpload, task.proof_media_id)
            if media:
                media_info = {
                    "s3_key": media.s3_key,
                    "file_type": media.file_type
                }
                
        result.append({
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "patient_id": task.assigned_to_id,
            "patient_name": patient.name if patient else "Unknown",
            "scheduled_date": task.scheduled_date,
            "start_time": task.start_time,
            "end_time": task.end_time,
            "is_completed": task.is_completed,
            "verified_by_caregiver": task.verified_by_caregiver,
            "proof_media_id": task.proof_media_id,
            "media": media_info,
            "verification_notes": task.verification_notes,
            "task_type": task.task_type,
            "created_at": task.created_at.isoformat()
        })
    
    return result

@router.get("/dashboard-stats")
def get_dashboard_stats(caregiver_id: str, session: Session = Depends(get_session)):
    caregiver = session.get(User, caregiver_id)
    if not caregiver or not caregiver.therapist_id:
        return {
            "stats": [
                {"icon": "👥", "label": "Patients", "value": "0", "color": "from-[#d4b5d4] to-[#b8a0b8]"},
                {"icon": "✅", "label": "Completed Tasks", "value": "0", "color": "from-[#a8d8d8] to-[#9bc5c5]"},
                {"icon": "⏰", "label": "Pending Tasks", "value": "0", "color": "from-[#e6d4a8] to-[#d9c79a]"},
                {"icon": "⚠️", "label": "Overdue", "value": "0", "color": "from-[#e6b8a8] to-[#d9a89a]"},
            ],
            "recentActivities": []
        }

    links = session.exec(select(CaregiverPatient).where(CaregiverPatient.caregiver_id == caregiver_id)).all()
    patient_ids = [link.patient_id for link in links]
    
    if not patient_ids:
         return {
            "stats": [
                {"icon": "👥", "label": "Patients", "value": "0", "color": "from-[#d4b5d4] to-[#b8a0b8]"},
                {"icon": "✅", "label": "Completed Tasks", "value": "0", "color": "from-[#a8d8d8] to-[#9bc5c5]"},
                {"icon": "⏰", "label": "Pending Tasks", "value": "0", "color": "from-[#e6d4a8] to-[#d9c79a]"},
                {"icon": "⚠️", "label": "Overdue", "value": "0", "color": "from-[#e6b8a8] to-[#d9a89a]"},
            ],
            "recentActivities": []
        }
        
    patients = session.exec(select(User).where(User.id.in_(patient_ids))).all()

    # Get tasks for these patients
    tasks = session.exec(select(Task).where(Task.assigned_to_id.in_(patient_ids))).all()
    
    from datetime import datetime
    import pytz
    
    tz = pytz.timezone('Asia/Kolkata')
    today_str = datetime.now(tz).strftime('%Y-%m-%d')
    
    completed_count = sum(1 for t in tasks if t.is_completed)
    pending_count = sum(1 for t in tasks if not t.is_completed and t.scheduled_date and t.scheduled_date >= today_str)
    overdue_count = sum(1 for t in tasks if not t.is_completed and t.scheduled_date and t.scheduled_date < today_str)

    # Recent activities (last 5 tasks)
    recent_tasks = sorted(tasks, key=lambda t: t.created_at, reverse=True)[:5]
    recent_activities = []
    for t in recent_tasks:
        patient = next((p for p in patients if p.id == t.assigned_to_id), None)
        patient_name = patient.name if patient else "Unknown"
        status = "completed" if t.is_completed else "pending"
        recent_activities.append({
            "patient": patient_name,
            "task": t.title,
            "status": status,
            "time": t.created_at.strftime("%H:%M") # Simplified time
        })

    return {
        "stats": [
            {"icon": "👥", "label": "Patients", "value": str(len(patients)), "color": "from-[#d4b5d4] to-[#b8a0b8]"},
            {"icon": "✅", "label": "Completed Tasks", "value": str(completed_count), "color": "from-[#a8d8d8] to-[#9bc5c5]"},
            {"icon": "⏰", "label": "Pending Tasks", "value": str(pending_count), "color": "from-[#e6d4a8] to-[#d9c79a]"},
            {"icon": "⚠️", "label": "Overdue", "value": str(overdue_count), "color": "from-[#e6b8a8] to-[#d9a89a]"},
        ],
        "recentActivities": recent_activities
    }

@router.post("/verify-task")
def verify_task(verification: TaskVerification, session: Session = Depends(get_session)):
    task = session.get(Task, verification.task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task.verified_by_caregiver = verification.verified
    if verification.notes is not None:
        task.verification_notes = verification.notes
        
    session.add(task)
    session.commit()
    
    # Notify therapist that caregiver verified it
    if verification.verified:
        patient = session.get(User, task.assigned_to_id)
        if patient and patient.therapist_id:
            p_name = patient.name or "Patient"
            create_notification(
                session, patient.therapist_id, "task",
                "Task Verified & Completed",
                f"Caregiver verified that {p_name} completed \"{task.title}\""
            )
            session.commit()

    return {"message": "Task verification updated"}

@router.get("/patients")
def get_patients(caregiver_id: str, session: Session = Depends(get_session)):
    caregiver = session.get(User, caregiver_id)
    # Get linked patients
    links = session.exec(select(CaregiverPatient).where(CaregiverPatient.caregiver_id == caregiver_id)).all()
    patient_ids = [link.patient_id for link in links]
    
    if not patient_ids:
        return []
        
    patients = session.exec(select(User).where(User.id.in_(patient_ids))).all()
    
    # Calculate stats for each patient
    result = []
    for p in patients:
        tasks = session.exec(select(Task).where(Task.assigned_to_id == p.id)).all()
        total = len(tasks)
        completed = sum(1 for t in tasks if t.is_completed)
        
        therapist_name = "Unknown Therapist"
        if p.therapist_id:
            th = session.get(User, p.therapist_id)
            if th:
                therapist_name = th.name or th.email

        result.append({
            "id": p.id,
            "name": p.name or p.email,
            "therapist_name": therapist_name,
            "tasksCompleted": completed,
            "totalTasks": total,
            "lastActivity": "Today", # Placeholder
            "status": "active" if total > 0 else "needs-attention",
            "avatar": "👤"
        })
    return result

@router.get("/patient/{patient_id}")
def get_patient_details(patient_id: str, session: Session = Depends(get_session)):
    patient = session.get(User, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    therapist_name = "Unknown"
    if patient.therapist_id:
        therapist = session.get(User, patient.therapist_id)
        if therapist:
            therapist_name = therapist.name or therapist.email

    return {
        "id": patient.id,
        "name": patient.name or patient.email,
        "avatar": "👤",
        "therapist": therapist_name,
        "emergencyContact": "N/A",
        "lastVisit": "Recently"
    }

@router.get("/patient/{patient_id}/tasks")
def get_patient_tasks(patient_id: str, session: Session = Depends(get_session)):
    tasks = session.exec(select(Task).where(Task.assigned_to_id == patient_id)).all()
    
    result = []
    for task in tasks:
        media_info = {}
        if task.proof_media_id:
            media = session.get(MediaUpload, task.proof_media_id)
            if media:
                media_info = {
                    "s3_key": media.s3_key,
                    "file_type": media.file_type
                }
        
        result.append({
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "patient_id": task.assigned_to_id,
            "scheduled_date": task.scheduled_date,
            "start_time": task.start_time,
            "end_time": task.end_time,
            "is_completed": task.is_completed,
            "verified_by_caregiver": task.verified_by_caregiver,
            "proof_media_id": task.proof_media_id,
            "media": media_info,
            "verification_notes": task.verification_notes,
            "task_type": task.task_type,
            "created_at": task.created_at.isoformat() if task.created_at else None
        })
    return result



@router.get("/patient/{patient_id}/notes")
def get_patient_notes(patient_id: str, session: Session = Depends(get_session)):
    notes = session.exec(select(CaregiverNote).where(CaregiverNote.patient_id == patient_id)).all()
    result = []
    for n in notes:
        author = session.get(User, n.author_id)
        author_name = author.name if author else "Unknown"
        result.append({
            "author": author_name,
            "date": n.created_at.strftime("%Y-%m-%d %H:%M"),
            "note": n.content
        })
    return result

class NewNote(BaseModel):
    patient_id: str
    author_id: str
    content: str

class LinkPatientRequest(BaseModel):
    caregiver_id: str
    code: str

@router.post("/link-patient")
def link_patient(link_data: LinkPatientRequest, session: Session = Depends(get_session)):
    caregiver = session.get(User, link_data.caregiver_id)
    if not caregiver:
        raise HTTPException(status_code=404, detail="Caregiver not found")
        
    print(f"DEBUG: Caregiver {caregiver.id} trying to link with code '{link_data.code}'")
    patient = session.exec(select(User).where(User.caregiver_code == link_data.code)).first()
    if not patient:
        print(f"DEBUG: No patient found with code '{link_data.code}'")
        raise HTTPException(status_code=404, detail="Invalid code")
        
    if not patient.therapist_id:
        raise HTTPException(status_code=400, detail="Patient is not linked to a therapist yet. Cannot join team.")
        
    # Link caregiver to the same therapist to join the care team
    # Link caregiver to the same therapist to join the care team (keep for broad access if needed/legacy)
    caregiver.therapist_id = patient.therapist_id
    session.add(caregiver)
    
    # Create explicit Caregiver-Patient link
    existing_link = session.exec(select(CaregiverPatient).where(
        CaregiverPatient.caregiver_id == caregiver.id, 
        CaregiverPatient.patient_id == patient.id
    )).first()
    
    if not existing_link:
        new_link = CaregiverPatient(caregiver_id=caregiver.id, patient_id=patient.id)
        session.add(new_link)
    
    session.commit()

    # Notification for patient about caregiver connection
    c_name = caregiver.name or "A caregiver"
    create_notification(
        session, patient.id, "caregiver_link",
        "Caregiver Connected",
        f"Caregiver {c_name} has been connected to you"
    )
    session.commit()

    return {"message": "Successfully linked to patient", "patient_name": patient.name}

@router.post("/notes")
def add_note(note_data: NewNote, session: Session = Depends(get_session)):
    note = CaregiverNote(
        content=note_data.content,
        author_id=note_data.author_id,
        patient_id=note_data.patient_id
    )
    session.add(note)
    session.commit()
    return {"message": "Note added"}

@router.get("/reports")
def get_reports(caregiver_id: str, period: str = "week", session: Session = Depends(get_session)):
    caregiver = session.get(User, caregiver_id)
    links = session.exec(select(CaregiverPatient).where(CaregiverPatient.caregiver_id == caregiver_id)).all()
    patient_ids = [link.patient_id for link in links]
    
    if not patient_ids:
        return {}
        
    patients = session.exec(select(User).where(User.id.in_(patient_ids))).all()
    
    if not patient_ids:
        return {}
        
    tasks = session.exec(select(Task).where(Task.assigned_to_id.in_(patient_ids))).all()
    
    # Task Completion Data
    from collections import defaultdict
    date_counts = defaultdict(lambda: {"completed": 0, "total": 0})
    for t in tasks:
        if t.scheduled_date:
            date_counts[t.scheduled_date]["total"] += 1
            if t.is_completed:
                date_counts[t.scheduled_date]["completed"] += 1
    
    task_completion_data = [
        {"day": d, "completed": c["completed"], "total": c["total"]} 
        for d, c in sorted(date_counts.items())[-7:] 
    ]
    
    # Patient Progress
    patient_progress = []
    for p in patients:
        p_tasks = [t for t in tasks if t.assigned_to_id == p.id]
        if p_tasks:
            progress = int((sum(1 for t in p_tasks if t.is_completed) / len(p_tasks)) * 100)
        else:
            progress = 0
        patient_progress.append({"name": p.name or p.email, "progress": progress})
        
    # Task Type Data
    type_counts = defaultdict(int)
    for t in tasks:
        t_type = t.task_type or "General"
        type_counts[t_type] += 1
    
    task_type_data = [
        {"name": k, "value": v, "color": "#ff6b9d"} for k, v in type_counts.items()
    ]
    
    verified_count = sum(1 for t in tasks if t.verified_by_caregiver)
    total_completed = sum(1 for t in tasks if t.is_completed)
    completion_rate = int((total_completed / len(tasks) * 100)) if tasks else 0
    
    verification_stats = [
        {"label": "Tasks Verified", "value": str(verified_count), "change": "+0%", "color": "from-[#a8d8d8] to-[#9bc5c5]"},
        {"label": "Completion Rate", "value": f"{completion_rate}%", "change": "+0%", "color": "from-[#c4b5e6] to-[#b8a8d9]"},
        {"label": "Total Patients", "value": str(len(patients)), "change": "0", "color": "from-[#d4b5d4] to-[#b8a0b8]"},
        {"label": "Total Tasks", "value": str(len(tasks)), "change": "0", "color": "from-[#e6d4a8] to-[#d9c79a]"},
    ]

    return {
        "taskCompletionData": task_completion_data,
        "patientProgressData": patient_progress,
        "taskTypeData": task_type_data,
        "verificationStats": verification_stats
    }

@router.get("/notifications")
def get_notifications(caregiver_id: str, session: Session = Depends(get_session)):
    # Generate dynamic notifications from recent tasks/notes
    caregiver = session.get(User, caregiver_id)
    if not caregiver:
        return []

    # Get linked patients
    links = session.exec(select(CaregiverPatient).where(CaregiverPatient.caregiver_id == caregiver_id)).all()
    patient_ids = [link.patient_id for link in links]
    
    if not patient_ids:
        return []
    
    patients = session.exec(select(User).where(User.id.in_(patient_ids))).all()

    notifications = []
    
    # Unverified completed tasks
    recent_tasks = session.exec(select(Task).where(Task.assigned_to_id.in_(patient_ids), Task.is_completed == True, Task.verified_by_caregiver == False).limit(5)).all()
    for t in recent_tasks:
        p = next((pat for pat in patients if pat.id == t.assigned_to_id), None)
        p_name = p.name if p else "Patient"
        notifications.append({
            "id": t.id,
            "type": "task",
            "title": "Task Completed",
            "message": f"{p_name} completed '{t.title}' - Verification needed",
            "time": t.created_at.strftime("%H:%M"), # simplified
            "read": False,
            "color": "from-[#00d2d3] to-[#54a0ff]",
            "icon": "ClipboardCheck" # string representation, frontend maps it
        })

    # Recent notes
    recent_notes = session.exec(select(CaregiverNote).where(CaregiverNote.patient_id.in_(patient_ids)).order_by(CaregiverNote.created_at.desc()).limit(5)).all()
    for n in recent_notes:
         p = next((pat for pat in patients if pat.id == n.patient_id), None)
         p_name = p.name if p else "Patient"
         notifications.append({
            "id": n.id,
            "type": "update",
            "title": "New Note",
            "message": f"Note for {p_name}: {n.content[:50]}...",
            "time": n.created_at.strftime("%H:%M"),
            "read": True,
            "color": "from-[#a55eea] to-[#8c7ae6]",
            "icon": "ClipboardCheck"
        })

    return notifications

@router.get("/patient/{patient_id}/progress")
def get_patient_progress(patient_id: str, session: Session = Depends(get_session)):
    tasks = session.exec(select(Task).where(Task.assigned_to_id == patient_id)).all()
    
    categories = [
        {"category": "Medication Compliance", "progress": 0, "color": "from-[#00d2d3] to-[#54a0ff]"},
        {"category": "Physical Therapy", "progress": 0, "color": "from-[#ff6b9d] to-[#c44569]"},
        {"category": "Daily Activities", "progress": 0, "color": "from-[#ffa726] to-[#ff7043]"},
        {"category": "Cognitive Exercises", "progress": 0, "color": "from-[#a55eea] to-[#8c7ae6]"},
    ]
    
    if tasks:
         completed = sum(1 for t in tasks if t.is_completed)
         total = len(tasks)
         overall_progress = int((completed/total)*100) if total > 0 else 0
         for c in categories:
             c["progress"] = overall_progress

    milestones = []
    completed_tasks = [t for t in tasks if t.is_completed]
    for i, t in enumerate(completed_tasks[-5:]):
        milestones.append({
            "milestone": f"Completed '{t.title}'",
            "date": t.created_at.strftime("%b %d, %Y"),
            "status": "completed"
        })
    
    return {
        "categories": categories,
        "milestones": milestones
    }

class ProfileUpdate(BaseModel):
    name: str = None
    email: str = None
    phone: str = None
    address: str = None
    experience: str = None
    certification: str = None

@router.put("/profile/{user_id}")
def update_profile(user_id: str, profile: ProfileUpdate, session: Session = Depends(get_session)):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if profile.name is not None: user.name = profile.name
    if profile.email is not None: user.email = profile.email
    if profile.phone is not None: user.phone = profile.phone
    if profile.address is not None: user.address = profile.address
    if profile.experience is not None: user.experience = profile.experience
    if profile.certification is not None: user.certification = profile.certification
    
    session.add(user)
    session.commit()
    session.refresh(user)
    return {"message": "Profile updated", "user": user}
