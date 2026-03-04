"""Debug v4: Try to directly trigger get_patients by calling it like FastAPI would, using JSONResponse"""
import os, sys, json

os.chdir(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, '.')

from dotenv import load_dotenv
load_dotenv()
from database import engine
from sqlmodel import Session, select
from models import User, Role, CaregiverPatient
from fastapi.encoders import jsonable_encoder

session = Session(engine)
t1 = session.exec(select(User).where(User.email == "therapist1@gmail.com")).first()
therapist_id = t1.id
print(f"Therapist id: {therapist_id}")

statement = select(User).where(User.therapist_id == therapist_id).where(User.role == Role.PATIENT)
patients = session.exec(statement).all()
print(f"Patients: {len(patients)}")

for patient in patients:
    print(f"\nPatient: {patient.email}")
    links = session.exec(select(CaregiverPatient).where(CaregiverPatient.patient_id == patient.id)).all()
    caregiver_names = [session.get(User, link.caregiver_id).name for link in links if session.get(User, link.caregiver_id)]

    patient_data = {
        "id": patient.id,
        "email": patient.email,
        "name": patient.name,
        "role": str(patient.role),
        "caregiver_code": patient.caregiver_code,
        "therapist_id": patient.therapist_id,
        "createdAt": patient.createdAt.isoformat() if patient.createdAt else None,
        "caregivers": caregiver_names
    }
    # Try to JSONify it like FastAPI would
    try:
        serialized = jsonable_encoder(patient_data)
        print(f"  jsonable_encoder: OK")
        print(f"  data: {json.dumps(serialized)}")
    except Exception as e:
        import traceback
        print(f"  jsonable_encoder FAILED: {e}")
        traceback.print_exc()

    # Also try json.dumps directly
    try:
        raw = json.dumps(patient_data)
        print(f"  json.dumps: OK -> {raw[:100]}")
    except Exception as e:
        print(f"  json.dumps FAILED: {e}")
