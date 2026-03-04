from sqlmodel import SQLModel, create_engine
from models import CaregiverPatient

# Database connection
sqlite_file_name = "test_database.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"
engine = create_engine(sqlite_url)

def create_table():
    print("Creating CaregiverPatient table...")
    SQLModel.metadata.create_all(engine)
    print("Table created successfully!")

if __name__ == "__main__":
    create_table()
