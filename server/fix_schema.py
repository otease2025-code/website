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

            if 'scheduled_date' not in columns:
                print("Adding 'scheduled_date' column...")
                try:
                    connection.execute(text("ALTER TABLE task ADD COLUMN scheduled_date VARCHAR"))
                    connection.commit()
                    print("'scheduled_date' column added.")
                except Exception as e:
                    print(f"Error adding column: {e}")
            else:
                print("'scheduled_date' column already exists.")
            
            # check if day_of_week is nullable?
            # It's hard to check nullability portably with inspect in some versions, but we can just try to alter it.
            if 'day_of_week' in columns:
                print("Ensuring 'day_of_week' is nullable...")
                try:
                    connection.execute(text("ALTER TABLE task ALTER COLUMN day_of_week DROP NOT NULL"))
                    connection.commit()
                    print("'day_of_week' is now nullable.")
                except Exception as e:
                     print(f"Could not alter day_of_week (might already be nullable or other issue): {e}")

        else:
            print("Table 'task' does not exist!")

except Exception as e:
    print(f"Database connection failed: {e}")
