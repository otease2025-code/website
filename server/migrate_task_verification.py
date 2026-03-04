from sqlmodel import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL not found in .env")

engine = create_engine(DATABASE_URL)

def migrate():
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE task ADD COLUMN IF NOT EXISTS proof_media_id VARCHAR;"))
        conn.execute(text("ALTER TABLE task ADD COLUMN IF NOT EXISTS verification_notes VARCHAR;"))
        conn.commit()
        print("Migration successful: Added proof_media_id and verification_notes to Task table")

if __name__ == "__main__":
    migrate()
