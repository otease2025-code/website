from sqlmodel import create_engine, text
from database import DATABASE_URL

# Ensure the URL is compatible with SQLAlchemy (postgres -> postgresql)
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)

def update_schema():
    with engine.connect() as connection:
        print("Adding therapist_id column...")
        try:
            connection.execute(text('ALTER TABLE "user" ADD COLUMN IF NOT EXISTS therapist_id VARCHAR;'))
            print("Added therapist_id.")
        except Exception as e:
            print(f"Error adding therapist_id: {e}")

        print("Adding caregiver_patient_id column...")
        try:
            connection.execute(text('ALTER TABLE "user" ADD COLUMN IF NOT EXISTS caregiver_patient_id VARCHAR;'))
            print("Added caregiver_patient_id.")
        except Exception as e:
            print(f"Error adding caregiver_patient_id: {e}")

        print("Adding specialization column...")
        try:
            connection.execute(text('ALTER TABLE "user" ADD COLUMN IF NOT EXISTS specialization VARCHAR;'))
            print("Added specialization.")
        except Exception as e:
            print(f"Error adding specialization: {e}")

        print("Adding license_number column...")
        try:
            connection.execute(text('ALTER TABLE "user" ADD COLUMN IF NOT EXISTS license_number VARCHAR;'))
            print("Added license_number.")
        except Exception as e:
            print(f"Error adding license_number: {e}")
            
        connection.commit()
    print("Schema updated successfully.")

if __name__ == "__main__":
    update_schema()
