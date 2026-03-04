from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from database import get_session
from models import (
    User, Role, Notification, Task, Appointment, Billing,
    MoodEntry, CaregiverPatient, LinkageCode
)
from datetime import datetime, timedelta, timezone
import uuid

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

# IST timezone offset (+5:30)
IST = timezone(timedelta(hours=5, minutes=30))


@router.get("")
def get_notifications(user_id: str, session: Session = Depends(get_session)):
    """Get all notifications for a user, newest first."""
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
    """Generate time-based notifications (called when user opens the notifications page)."""
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


# ──────────────────────────────────────────────
# THERAPIST notification generation
# ──────────────────────────────────────────────

def _generate_therapist_notifications(
    therapist: User, today_str: str, tomorrow_str: str, now_ist: datetime, session: Session
) -> int:
    count = 0

    # Get patients linked to this therapist
    patients = session.exec(
        select(User).where(User.therapist_id == therapist.id, User.role == Role.PATIENT)
    ).all()
    patient_ids = [p.id for p in patients]

    if not patient_ids:
        return 0

    patient_map = {p.id: p.name or "Patient" for p in patients}

    # 1. Appointment today (12:01 AM) notifications
    today_appointments = session.exec(
        select(Appointment).where(
            Appointment.therapist_id == therapist.id
        )
    ).all()

    for appt in today_appointments:
        appt_date = appt.datetime.strftime("%Y-%m-%d")
        p_name = patient_map.get(appt.patient_id, "Patient")

        if appt_date == today_str:
            key = f"appt_today_{appt.id}"
            if not _notification_exists(therapist.id, key, session):
                _create_notification(
                    session, therapist.id, "appointment",
                    "Appointment Today",
                    f"You have an appointment with {p_name} today",
                    key
                )
                count += 1

        # 2. Appointment tomorrow (previous day reminder)
        if appt_date == tomorrow_str:
            key = f"appt_tomorrow_{appt.id}"
            if not _notification_exists(therapist.id, key, session):
                _create_notification(
                    session, therapist.id, "appointment",
                    "Appointment Tomorrow",
                    f"Reminder: Appointment with {p_name} tomorrow",
                    key
                )
                count += 1

    # 3. Recent patient mood logs (last 24 hours, not yet notified)
    yesterday = now_ist - timedelta(hours=24)
    yesterday_utc = yesterday.astimezone(timezone.utc).replace(tzinfo=None)
    mood_entries = session.exec(
        select(MoodEntry).where(
            MoodEntry.user_id.in_(patient_ids),
            MoodEntry.created_at >= yesterday_utc,
        )
    ).all()

    for mood in mood_entries:
        p_name = patient_map.get(mood.user_id, "Patient")
        key = f"mood_log_{mood.id}"
        if not _notification_exists(therapist.id, key, session):
            detail = ""
            if mood.journal_text:
                detail = " (with journal entry)"
            _create_notification(
                session, therapist.id, "patient",
                "New Patient Log",
                f"{p_name} submitted a mood entry (score: {mood.mood_score}){detail}",
                key
            )
            count += 1

    # 4. Task completions (last 24 hours, not yet notified)
    completed_tasks = session.exec(
        select(Task).where(
            Task.assigned_to_id.in_(patient_ids),
            Task.is_completed == True,
            Task.created_at >= yesterday_utc,
        )
    ).all()

    for task in completed_tasks:
        p_name = patient_map.get(task.assigned_to_id, "Patient")
        key = f"task_complete_{task.id}"
        if not _notification_exists(therapist.id, key, session):
            media_note = " (with media proof)" if task.proof_media_id else " (no media attached)"
            _create_notification(
                session, therapist.id, "task",
                "Task Completed",
                f"{p_name} completed \"{task.title}\"{media_note}",
                key
            )
            count += 1

    # 5. New patient registrations (last 7 days, not yet notified)
    week_ago_utc = (now_ist - timedelta(days=7)).astimezone(timezone.utc).replace(tzinfo=None)
    new_patients = session.exec(
        select(User).where(
            User.therapist_id == therapist.id,
            User.role == Role.PATIENT,
            User.createdAt >= week_ago_utc,
        )
    ).all()

    for patient in new_patients:
        key = f"new_patient_{patient.id}"
        if not _notification_exists(therapist.id, key, session):
            _create_notification(
                session, therapist.id, "patient",
                "New Patient Registered",
                f"{patient.name or 'A patient'} created an account using your linkage code",
                key
            )
            count += 1

    session.commit()
    return count


# ──────────────────────────────────────────────
# PATIENT notification generation
# ──────────────────────────────────────────────

def _generate_patient_notifications(
    patient: User, today_str: str, tomorrow_str: str, now_ist: datetime, session: Session
) -> int:
    count = 0

    # 1. Task reminders — tasks starting within 10 minutes
    tasks = session.exec(
        select(Task).where(
            Task.assigned_to_id == patient.id,
            Task.scheduled_date == today_str,
            Task.is_completed == False,
        )
    ).all()

    for task in tasks:
        try:
            start_parts = task.start_time.split(":")
            task_start = now_ist.replace(
                hour=int(start_parts[0]),
                minute=int(start_parts[1]),
                second=0, microsecond=0
            )
            diff = (task_start - now_ist).total_seconds()
            # Notify if task starts within 10 minutes AND hasn't started yet
            if 0 < diff <= 600:
                key = f"task_reminder_{task.id}_{today_str}"
                if not _notification_exists(patient.id, key, session):
                    _create_notification(
                        session, patient.id, "reminder",
                        "Task Starting Soon",
                        f"Task \"{task.title}\" starts in {int(diff // 60)} minutes",
                        key
                    )
                    count += 1
        except (ValueError, IndexError):
            pass

    # 2. Appointment today
    if patient.therapist_id:
        therapist = session.get(User, patient.therapist_id)
        t_name = therapist.name if therapist else "your therapist"

        appointments = session.exec(
            select(Appointment).where(
                Appointment.patient_id == patient.id
            )
        ).all()

        for appt in appointments:
            appt_date = appt.datetime.strftime("%Y-%m-%d")
            if appt_date == today_str:
                key = f"appt_today_{appt.id}"
                if not _notification_exists(patient.id, key, session):
                    _create_notification(
                        session, patient.id, "appointment",
                        "Appointment Today",
                        f"Your appointment with {t_name} is today",
                        key
                    )
                    count += 1

            # 3. Appointment tomorrow
            if appt_date == tomorrow_str:
                key = f"appt_tomorrow_{appt.id}"
                if not _notification_exists(patient.id, key, session):
                    _create_notification(
                        session, patient.id, "appointment",
                        "Appointment Tomorrow",
                        f"Reminder: Your appointment with {t_name} is tomorrow",
                        key
                    )
                    count += 1

    # 4. Welcome notification (if therapist is linked)
    if patient.therapist_id:
        key = f"welcome_{patient.id}"
        if not _notification_exists(patient.id, key, session):
            therapist = session.get(User, patient.therapist_id)
            t_name = therapist.name if therapist else "your therapist"
            _create_notification(
                session, patient.id, "welcome",
                "Welcome to OTease!",
                f"You're connected with therapist {t_name}. Start your journey!",
                key
            )
            count += 1

    # 5. Caregiver connected
    caregiver_links = session.exec(
        select(CaregiverPatient).where(CaregiverPatient.patient_id == patient.id)
    ).all()

    for link in caregiver_links:
        key = f"caregiver_link_{link.id}"
        if not _notification_exists(patient.id, key, session):
            caregiver = session.get(User, link.caregiver_id)
            c_name = caregiver.name if caregiver else "A caregiver"
            _create_notification(
                session, patient.id, "caregiver_link",
                "Caregiver Connected",
                f"Caregiver {c_name} has been connected to you",
                key
            )
            count += 1

    # 6. Recent billing notifications (last 7 days)
    week_ago_utc = (now_ist - timedelta(days=7)).astimezone(timezone.utc).replace(tzinfo=None)
    bills = session.exec(
        select(Billing).where(
            Billing.patient_id == patient.id,
            Billing.created_at >= week_ago_utc,
        )
    ).all()

    for bill in bills:
        key = f"billing_{bill.id}"
        if not _notification_exists(patient.id, key, session):
            _create_notification(
                session, patient.id, "billing",
                "New Billing",
                f"New bill of ₹{bill.amount:.0f} from your therapist" +
                (f" — {bill.description}" if bill.description else ""),
                key
            )
            count += 1

    session.commit()
    return count


# ──────────────────────────────────────────────
# CAREGIVER notification generation
# ──────────────────────────────────────────────

def _generate_caregiver_notifications(
    caregiver: User, today_str: str, now_ist: datetime, session: Session
) -> int:
    count = 0

    # Get linked patients
    links = session.exec(
        select(CaregiverPatient).where(CaregiverPatient.caregiver_id == caregiver.id)
    ).all()
    patient_ids = [link.patient_id for link in links]

    if not patient_ids:
        return 0

    patients = session.exec(select(User).where(User.id.in_(patient_ids))).all()
    patient_map = {p.id: p.name or "Patient" for p in patients}

    # 1. Verification pending — completed tasks not yet verified
    pending_tasks = session.exec(
        select(Task).where(
            Task.assigned_to_id.in_(patient_ids),
            Task.is_completed == True,
            Task.verified_by_caregiver == False,
        )
    ).all()

    for task in pending_tasks:
        p_name = patient_map.get(task.assigned_to_id, "Patient")
        key = f"verify_pending_{task.id}"
        if not _notification_exists(caregiver.id, key, session):
            media_note = " (has media proof)" if task.proof_media_id else ""
            _create_notification(
                session, caregiver.id, "task",
                "Verification Pending",
                f"{p_name} completed \"{task.title}\" — Verification needed{media_note}",
                key
            )
            count += 1

    # 2. Overdue tasks — past end_time, not completed
    all_tasks_today_or_past = session.exec(
        select(Task).where(
            Task.assigned_to_id.in_(patient_ids),
            Task.is_completed == False,
            Task.scheduled_date <= today_str,
        )
    ).all()

    for task in all_tasks_today_or_past:
        try:
            task_date = datetime.strptime(task.scheduled_date, "%Y-%m-%d").date()
            end_parts = task.end_time.split(":")
            task_end = datetime(
                task_date.year, task_date.month, task_date.day,
                int(end_parts[0]), int(end_parts[1]),
                tzinfo=IST
            )
            if now_ist > task_end:
                p_name = patient_map.get(task.assigned_to_id, "Patient")
                key = f"overdue_{task.id}"
                if not _notification_exists(caregiver.id, key, session):
                    _create_notification(
                        session, caregiver.id, "alert",
                        "Overdue Task",
                        f"{p_name}'s task \"{task.title}\" is overdue (was due {task.scheduled_date} at {task.end_time})",
                        key
                    )
                    count += 1
        except (ValueError, IndexError):
            pass

    session.commit()
    return count


# ──────────────────────────────────────────────
# Helper functions
# ──────────────────────────────────────────────

def _notification_exists(user_id: str, key: str, session: Session) -> bool:
    """Check if a notification with this key already exists (use message contains key pattern)."""
    # We store the key in the notification id field to prevent duplicates
    existing = session.exec(
        select(Notification).where(
            Notification.user_id == user_id,
            Notification.id == key,
        )
    ).first()
    return existing is not None


def _create_notification(
    session: Session,
    user_id: str,
    notif_type: str,
    title: str,
    message: str,
    key: str | None = None,
):
    """Create a notification. If key is provided, use it as the ID for dedup."""
    notif = Notification(
        id=key or str(uuid.uuid4()),
        user_id=user_id,
        type=notif_type,
        title=title,
        message=message,
    )
    session.add(notif)


def create_notification(
    session: Session,
    user_id: str,
    notif_type: str,
    title: str,
    message: str,
):
    """Public helper — called from other routers for event-driven notifications."""
    notif = Notification(
        id=str(uuid.uuid4()),
        user_id=user_id,
        type=notif_type,
        title=title,
        message=message,
    )
    session.add(notif)


def _format_time_ago(dt: datetime) -> str:
    """Format a datetime as a human-readable relative time string."""
    now = datetime.utcnow()
    diff = now - dt
    seconds = diff.total_seconds()

    if seconds < 60:
        return "Just now"
    elif seconds < 3600:
        mins = int(seconds // 60)
        return f"{mins} min{'s' if mins != 1 else ''} ago"
    elif seconds < 86400:
        hours = int(seconds // 3600)
        return f"{hours} hour{'s' if hours != 1 else ''} ago"
    elif seconds < 604800:
        days = int(seconds // 86400)
        return f"{days} day{'s' if days != 1 else ''} ago"
    else:
        return dt.strftime("%b %d, %Y")
