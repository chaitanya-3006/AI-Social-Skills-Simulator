import sqlite3
import os
from typing import Optional, Dict, Any

DB_FILE = os.path.join(os.path.dirname(__file__), "socialsim.db")

def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_FILE, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Pre-seed default user if not exists
    cursor.execute("SELECT id FROM users WHERE email = ?", ("chaitanya@example.com",))
    existing = cursor.fetchone()
    if not existing:
        from auth import hash_password
        default_pwd_hash = hash_password("password")
        cursor.execute(
            "INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)",
            ("usr_123", "Chaitanya", "chaitanya@example.com", default_pwd_hash)
        )
    
    conn.commit()
    conn.close()
