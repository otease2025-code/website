from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from database import get_session
from models import (
    User, Role, Notification, Task, Appointment, Billing,
    MoodEntry, CaregiverPatient, LinkageCode
)
from datetime import datetime, timedelta, timezone
import uuid
import asyncio

from pydantic import BaseModel
import firebase_admin
from firebase_admin import credentials, messaging

# ─────────────────────────────────────────────────────────────────────────────

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

IST = timezone(timedelta(hours=5, minutes=30))


# ─── Public Async Helper for other Routers ────────────────────────────────────

async def send_push_notification(user_id: str, title: str, body: str):
    """
    Called by therapist.py background tasks.
    Sends FCM push AND saves an in-app notification record.
    """
    # FIX: Correct way to manually use a FastAPI generator session
    session_gen = get_session()
    session = next(session_gen)
    try:
        user = session.get(User, user_id)
        if not user:
            print(f"[PUSH] User {user_id} not found")
            return

        # Save as in-app notification so it shows in portal
        notif = Notification(
            id=str(uuid.uuid4()),
            user_id=user_id,
            type="reminder",
            title=title,
            message=body
        )
        session.add(notif)
        session.commit()

        # Send FCM push if token exists
        if user.fcm_token:
            # FIX: Run blocking FCM call in thread pool — never block async event loop
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, _send_firebase_push, user.fcm_token, title, body)
        else:
            print(f"[PUSH] No FCM token for user {user_id} — in-app notification saved only")
    finally:
        # FIX: Properly close the generator session
        try:
            next(session_gen)
        except StopIteration:
            pass


# ─── Pydantic Models ──────────────────────────────────────────────────────────

class FCMTokenUpdate(BaseModel):
    user_id: str
    fcm_token: str


# ─── Routes ───────────────────────────────────────────────────────────────────

@router.post("/save-token")
def save_fcm_token(data: FCMTokenUpdate, session: Session = Depends(get_session)):
    user = session.get(User, data.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.fcm_token = data.fcm_token
    session.add(user)
    session.commit()
    return {"message": "Push notification token saved successfully"}


@router.get("")
def get_notifications(user_id: str, session: Session = Depends(get_session)):
    statement = (
        select(Notification)
        .where(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
        .limit(50)
    )
    notifications = session.exec(statement).all()
    return [
        {
            "id": n.id,
            "type": n.type,
            "title": n.title,
            "message": n.message,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat(),
            "time": _format_time_ago(n.created_at),
        }
        for n in notifications
    ]


@router.put("/{notification_id}/read")
def mark_as_read(notification_id: str, session: Session = Depends(get_session)):
    notif = session.get(Notification, notification_id)
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    session.add(notif)
    session.commit()
    return {"message": "Marked as read"}


@router.put("/read-all")
def mark_all_as_read(user_id: str, session: Session = Depends(get_session)):
    notifications = session.exec(
        select(Notification).where(
            Notification.user_id == user_id, Notification.is_read == False
        )
    ).all()
    for n in notifications:
        n.is_read = True
        session.add(n)
    session.commit()
    return {"message": f"Marked {len(notifications)} notifications as read"}


@router.delete("/{notification_id}")
def delete_notification(notification_id: str, session: Session = Depends(get_session)):
    notif = session.get(Notification, notification_id)
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    session.delete(notif)
    session.commit()
    return {"message": "Notification deleted"}


@router.post("/generate")
def generate_notifications(user_id: str, session: Session = Depends(get_session)):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    now_ist = datetime.now(IST)
    today_str = now_ist.strftime("%Y-%m-%d")
    tomorrow = now_ist + timedelta(days=1)
    tomorrow_str = tomorrow.strftime("%Y-%m-%d")

    generated = 0
    if user.role == Role.THERAPIST:
        generated += _generate_therapist_notifications(user, today_str, tomorrow_str, now_ist, session)
    elif user.role == Role.PATIENT:
        generated += _generate_patient_notifications(user, today_str, tomorrow_str, now_ist, session)
    elif user.role == Role.CAREGIVER:
        generated += _generate_caregiver_notifications(user, today_str, now_ist, session)

    return {"message": f"Generated {generated} notifications"}


# ─── Internal Notification Generation ────────────────────────────────────────

def _generate_therapist_notifications(therapist, today_str, tomorrow_str, now_ist, session):
    count = 0
    patients = session.exec(select(User).where(User.therapist_id == therapist.id, User.role == Role.PATIENT)).all()
    patient_ids = [p.id for p in patients]
    if not patient_ids: return 0
    patient_map = {p.id: p.name or "Patient" for p in patients}

    today_appointments = session.exec(select(Appointment).where(Appointment.therapist_id == therapist.id)).all()
    for appt in today_appointments:
        appt_ist = appt.datetime.replace(tzinfo=IST)
        appt_date = appt_ist.strftime("%Y-%m-%d")
        appt_time = appt_ist.strftime("%I:%M %p")
        p_name = patient_map.get(appt.patient_id, "Patient")

        if appt_date == today_str:
            key = f"appt_today_{appt.id}"
            if _create_notification(session, therapist.id, "appointment", "Appointment Today", f"Appointment with {p_name} at {appt_time}", key):
                count += 1
        elif appt_date == tomorrow_str:
            key = f"appt_tomorrow_{appt.id}"
            if _create_notification(session, therapist.id, "appointment", "Appointment Tomorrow", f"Reminder: Appointment with {p_name} tomorrow", key):
                count += 1
    session.commit()
    return count


def _generate_patient_notifications(patient, today_str, tomorrow_str, now_ist, session):
    count = 0
    tasks = session.exec(select(Task).where(
        Task.assigned_to_id == patient.id,
        Task.scheduled_date == today_str,
        Task.is_completed == False
    )).all()

    for task in tasks:
        try:
            start_parts = task.start_time.split(":")
            task_start = now_ist.replace(hour=int(start_parts[0]), minute=int(start_parts[1]), second=0, microsecond=0)
            diff = (task_start - now_ist).total_seconds()
            if 0 < diff <= 600:
                key = f"task_reminder_{task.id}_{today_str}"
                if _create_notification(session, patient.id, "reminder", "Task Starting Soon",
                                        f'Task "{task.title}" starts in {int(diff // 60)} minutes', key):
                    count += 1
        except:
            pass
    session.commit()
    return count


def _generate_caregiver_notifications(caregiver, today_str, now_ist, session):
    count = 0
    links = session.exec(select(CaregiverPatient).where(CaregiverPatient.caregiver_id == caregiver.id)).all()
    p_ids = [l.patient_id for l in links]
    if not p_ids: return 0

    pending = session.exec(select(Task).where(
        Task.assigned_to_id.in_(p_ids),
        Task.is_completed == True,
        Task.verified_by_caregiver == False
    )).all()

    for task in pending:
        key = f"verify_pending_{task.id}"
        if _create_notification(session, caregiver.id, "task", "Verification Pending",
                                f'Task "{task.title}" needs verification', key):
            count += 1
    session.commit()
    return count


# ─── Core Helpers ─────────────────────────────────────────────────────────────

def _send_firebase_push(fcm_token: str, title: str, body: str):
    """Synchronous FCM send — always call via run_in_executor from async code."""
    if not fcm_token:
        return
    try:
        message = messaging.Message(
            notification=messaging.Notification(title=title, body=body),
            android=messaging.AndroidConfig(
                priority='high',
                notification=messaging.AndroidNotification(
                    channel_id='default',
                    priority='high',
                    default_sound=True,
                    default_vibrate_timings=True,
                    visibility='public'
                ),
            ),
            apns=messaging.APNSConfig(  # iOS support
                payload=messaging.APNSPayload(
                    aps=messaging.Aps(sound='default', badge=1)
                )
            ),
            token=fcm_token,
        )
        messaging.send(message)
        print(f"[FCM] Push sent to {fcm_token[:10]}...")
    except Exception as e:
        print(f"[FCM] Error: {e}")


def _create_notification(session: Session, user_id: str, notif_type: str, title: str, message: str, key: str | None = None):
    final_id = key if key else str(uuid.uuid4())
    if session.get(Notification, final_id):
        return None  # deduplicate

    notif = Notification(id=final_id, user_id=user_id, type=notif_type, title=title, message=message)
    session.add(notif)

    user = session.get(User, user_id)
    if user and user.fcm_token:
        _send_firebase_push(user.fcm_token, title, message)
    return notif


def create_notification(session: Session, user_id: str, notif_type: str, title: str, message: str):
    """Public helper used by therapist.py for billing/appointment notifications."""
    notif = Notification(id=str(uuid.uuid4()), user_id=user_id, type=notif_type, title=title, message=message)
    session.add(notif)

    user = session.get(User, user_id)
    if user and user.fcm_token:
        _send_firebase_push(user.fcm_token, title, message)
    return notif


def _format_time_ago(dt: datetime) -> str:
    now = datetime.now(IST).replace(tzinfo=None)
    if dt.tzinfo:
        dt = dt.astimezone(IST).replace(tzinfo=None)
    diff = now - dt
    seconds = diff.total_seconds()
    if seconds < 60: return "Just now"
    if seconds < 3600: return f"{int(seconds // 60)} mins ago"
    if seconds < 86400: return f"{int(seconds // 3600)} hours ago"
    return dt.strftime("%b %d, %Y")
