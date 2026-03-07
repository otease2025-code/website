from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlmodel import Session, select
from database import get_session
from models import User, Role, LinkageCode, Task, MoodEntry, Billing, Appointment, MediaUpload, CaregiverPatient, PatientProfile
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel
import uuid
import asyncio
from routers.notifications import create_notification, send_push_notification # Ensure send_push_notification is exported in notifications.py

router = APIRouter(prefix="/api/therapist", tags=["therapist"])

IST = timezone(timedelta(hours=5, minutes=30))

# --- Helper Function for Delayed Patient Notification ---
async def schedule_deadline_warning(patient_id: str, task_title: str, end_time_str: str):
    """
    Background worker that waits until 5 minutes before the task deadline
    to send a push notification to the patient.
    """
    try:
        # 1. Parse the end_time (handling common frontend ISO formats)
        # Using fromisoformat and removing 'Z' if present
        clean_time = end_time_str.replace("Z", "").split(".")[0]
        end_time = datetime.fromisoformat(clean_time)
        
        # 2. Calculate the "Warning Time" (5 minutes before end)
        warning_time = end_time - timedelta(minutes=5)
        
        # 3. Calculate how many seconds to wait from "Now"
        # Note: Ensure both are naive or both are aware. Here we use naive for simplicity matching your IST logic.
        now = datetime.now()
        seconds_to_wait = (warning_time - now).total_seconds()

        if seconds_to_wait > 0:
            print(f"[DEBUG] Scheduling 5-min warning for task '{task_title}' in {seconds_to_wait} seconds.")
            await asyncio.sleep(seconds_to_wait)
            
            # 4. Trigger the push notification to the PATIENT
            await send_push_notification(
                user_id=patient_id,
                title="Hurry! ⏳",
                body=f"Only 5 minutes left to complete your task: {task_title}"
            )
    except Exception as e:
        print(f"[ERROR] Background notification failed: {e}")

class TaskAssign(BaseModel):
    title: str
    description: str | None = None
    patient_id: str
    scheduled_date: str  # YYYY-MM-DD format
    start_time: str
    end_time: str
    task_type: str = "general"

# ... (Keep AppointmentCreate, BillingCreate and generate_linkage_code / get_patients exactly as they are)

# --- UPDATED ASSIGN TASK ENDPOINT ---
@router.post("/tasks", status_code=status.HTTP_201_CREATED)
def assign_task(
    therapist_id: str, 
    task_data: TaskAssign, 
    background_tasks: BackgroundTasks, # Added this
    session: Session = Depends(get_session)
):
    # 1. Save Task to Database
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

    # 2. Add immediate In-App notification
    create_notification(
        session, task_data.patient_id, "task",
        "New Task Assigned",
        f"Therapist assigned a new task: {task_data.title}"
    )
    session.commit()

    # 3. Schedule the 5-minute Warning Push Notification for the Patient
    background_tasks.add_task(
        schedule_deadline_warning,
        task_data.patient_id,
        task_data.title,
        task_data.end_time
    )

    return {"message": "Task assigned successfully and reminder scheduled"}

# ... (Keep all other functions: Billing, Appointments, Progress, and Profiles exactly as they are)
