"""
Migration script to add 'description' and 'payment_method' columns to the billing table.
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "test_database.db")

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check existing columns
    cursor.execute("PRAGMA table_info(billing)")
    columns = [col[1] for col in cursor.fetchall()]
    
    if "description" not in columns:
        cursor.execute("ALTER TABLE billing ADD COLUMN description TEXT")
        print("Added 'description' column to billing table")
    else:
        print("'description' column already exists")
    
    if "payment_method" not in columns:
        cursor.execute("ALTER TABLE billing ADD COLUMN payment_method TEXT")
        print("Added 'payment_method' column to billing table")
    else:
        print("'payment_method' column already exists")
    
    conn.commit()
    conn.close()
    print("Migration complete!")

if __name__ == "__main__":
    migrate()
