import sqlalchemy
from sqlalchemy import create_engine, text, inspect
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

print(f"Connecting to database...")

try:
    engine = create_engine(DATABASE_URL)
    with engine.connect() as connection:
        print("Connected successfully.")
        inspector = inspect(engine)
        if inspector.has_table('task'):
            columns = [col['name'] for col in inspector.get_columns('task')]
            print(f"Current columns in 'task': {columns}")

            if 'task_type' not in columns:
                print("Adding 'task_type' column...")
                try:
                    # Add column with default value 'general'
                    connection.execute(text("ALTER TABLE task ADD COLUMN task_type VARCHAR DEFAULT 'general'"))
                    connection.commit()
                    print("'task_type' column added successfully.")
                except Exception as e:
                    print(f"Error adding column: {e}")
            else:
                print("'task_type' column already exists.")

        else:
            print("Table 'task' does not exist!")

except Exception as e:
    print(f"Database connection failed: {e}")
