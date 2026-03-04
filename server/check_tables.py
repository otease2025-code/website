from sqlmodel import create_engine, inspect
from database import DATABASE_URL

# Ensure the URL is compatible with SQLAlchemy (postgres -> postgresql)
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)

def check_tables():
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print("Tables:", tables)

if __name__ == "__main__":
    check_tables()
