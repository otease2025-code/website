"""Migration script to create the notification table."""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "database.db")

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check if notification table already exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='notification'")
    if cursor.fetchone():
        print("Table 'notification' already exists. Skipping.")
        conn.close()
        return
    
    cursor.execute("""
        CREATE TABLE notification (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES user(id),
            type TEXT NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            is_read BOOLEAN NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Add index on user_id for faster lookups
    cursor.execute("CREATE INDEX ix_notification_user_id ON notification(user_id)")
    
    conn.commit()
    conn.close()
    print("Successfully created 'notification' table.")

if __name__ == "__main__":
    migrate()
