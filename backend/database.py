import sqlite3
import os
import json
from typing import Optional, Dict, Any

DB_FILE = os.path.join(os.path.dirname(__file__), "socialsim.db")

def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_FILE, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

DEFAULT_SCENARIOS = [
    {
        "id": "networking-event",
        "skill_id": "small-talk",
        "title": "Networking Event Mixer",
        "description": "You are at a professional mixer. Strike up a conversation with someone you haven't met before.",
        "character_name": "Alex",
        "character_role": "College Student",
        "character_status": "Online",
        "character_tags": json.dumps(["Friendly", "Talkative", "Curious"]),
        "avatar_url": "https://api.dicebear.com/7.x/notionists/svg?seed=Alex&backgroundColor=b6e3f4"
    },
    {
        "id": "salary-negotiation",
        "skill_id": "confidence",
        "title": "Salary Negotiation",
        "description": "You have been offered a job, but the salary is lower than expected. Negotiate for a higher offer.",
        "character_name": "Sarah",
        "character_role": "HR Manager",
        "character_status": "Busy",
        "character_tags": json.dumps(["Professional", "Firm", "Fair"]),
        "avatar_url": "https://api.dicebear.com/7.x/notionists/svg?seed=Sarah&backgroundColor=ffdfbf"
    },
    {
        "id": "group-project",
        "skill_id": "conflict",
        "title": "Group Project Disagreement",
        "description": "A teammate is not pulling their weight on a project. Address the issue constructively.",
        "character_name": "Jordan",
        "character_role": "Classmate",
        "character_status": "Offline",
        "character_tags": json.dumps(["Defensive", "Stressed"]),
        "avatar_url": "https://api.dicebear.com/7.x/notionists/svg?seed=Jordan&backgroundColor=c0aede"
    },
    {
        "id": "active-listening-friend",
        "skill_id": "active-listening",
        "title": "Supporting a Stressed Colleague",
        "description": "A teammate is overwhelmed with their current workload and opens up to you. Listen and support them without being dismissive.",
        "character_name": "Elena",
        "character_role": "Software Engineer",
        "character_status": "Online",
        "character_tags": json.dumps(["Vulnerable", "Overworked", "Appreciative"]),
        "avatar_url": "https://api.dicebear.com/7.x/notionists/svg?seed=Elena&backgroundColor=ffd5dc"
    },
    {
        "id": "clear-presentation",
        "skill_id": "communication",
        "title": "Project Pitch to Stakeholders",
        "description": "Present an innovative new feature proposal to a skeptical project lead and clearly articulate its benefits.",
        "character_name": "Marcus",
        "character_role": "Product Director",
        "character_status": "Online",
        "character_tags": json.dumps(["Analytical", "Direct", "Results-Oriented"]),
        "avatar_url": "https://api.dicebear.com/7.x/notionists/svg?seed=Marcus&backgroundColor=d1d4f9"
    }
]

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Users table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # 2. Scenarios table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS scenarios (
            id TEXT PRIMARY KEY,
            skill_id TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            character_name TEXT NOT NULL,
            character_role TEXT NOT NULL,
            character_status TEXT NOT NULL,
            character_tags TEXT NOT NULL,
            avatar_url TEXT NOT NULL
        )
    """)

    # 3. Sessions table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            scenario_id TEXT NOT NULL,
            difficulty TEXT NOT NULL,
            status TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            ended_at TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (scenario_id) REFERENCES scenarios(id)
        )
    """)

    # 4. Messages table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES sessions(id)
        )
    """)

    # 5. Evaluations table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS evaluations (
            id TEXT PRIMARY KEY,
            session_id TEXT UNIQUE NOT NULL,
            overall_score REAL NOT NULL,
            skills_json TEXT NOT NULL,
            strengths_json TEXT NOT NULL,
            improvements_json TEXT NOT NULL,
            better_responses_json TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES sessions(id)
        )
    """)
    
    # Pre-seed default user if not exists
    cursor.execute("SELECT id FROM users WHERE email = ?", ("chaitanya@example.com",))
    existing_user = cursor.fetchone()
    if not existing_user:
        from auth import hash_password
        default_pwd_hash = hash_password("password")
        cursor.execute(
            "INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)",
            ("usr_123", "Chaitanya", "chaitanya@example.com", default_pwd_hash)
        )

    # Pre-seed default scenarios
    for sc in DEFAULT_SCENARIOS:
        cursor.execute("SELECT id FROM scenarios WHERE id = ?", (sc["id"],))
        if not cursor.fetchone():
            cursor.execute(
                """INSERT INTO scenarios 
                   (id, skill_id, title, description, character_name, character_role, character_status, character_tags, avatar_url)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (sc["id"], sc["skill_id"], sc["title"], sc["description"], sc["character_name"], sc["character_role"], sc["character_status"], sc["character_tags"], sc["avatar_url"])
            )
    
    # Pre-seed sample completed session for default user if no sessions exist
    cursor.execute("SELECT id FROM sessions WHERE user_id = ?", ("usr_123",))
    if not cursor.fetchone():
        sample_session_id = "session_sample_101"
        cursor.execute(
            "INSERT INTO sessions (id, user_id, scenario_id, difficulty, status, created_at, ended_at) VALUES (?, ?, ?, ?, ?, datetime('now', '-2 hours'), datetime('now', '-2 hours'))",
            (sample_session_id, "usr_123", "networking-event", "medium", "completed")
        )
        
        # Sample messages
        cursor.execute(
            "INSERT INTO messages (id, session_id, role, content, timestamp) VALUES (?, ?, ?, ?, datetime('now', '-2 hours'))",
            ("msg_sample_1", sample_session_id, "ai", "Hi there! I don't think we've met yet. I'm Alex!", )
        )
        cursor.execute(
            "INSERT INTO messages (id, session_id, role, content, timestamp) VALUES (?, ?, ?, ?, datetime('now', '-2 hours'))",
            ("msg_sample_2", sample_session_id, "user", "Hey Alex! Great to meet you. What brings you to the mixer today?", )
        )
        cursor.execute(
            "INSERT INTO messages (id, session_id, role, content, timestamp) VALUES (?, ?, ?, ?, datetime('now', '-2 hours'))",
            ("msg_sample_3", sample_session_id, "ai", "I'm studying computer science and looking to learn more about AI products. How about you?", )
        )

        # Sample evaluation
        eval_skills = json.dumps([
            {"name": "Communication", "score": 8.5},
            {"name": "Confidence", "score": 8.0},
            {"name": "Active Listening", "score": 9.0},
            {"name": "Small Talk", "score": 8.5}
        ])
        eval_strengths = json.dumps([
            "Started the interaction with a friendly, inviting question",
            "Demonstrated genuine curiosity and open body language",
            "Maintained comfortable conversational pacing"
        ])
        eval_improvements = json.dumps([
            "Share a bit more context about your own background earlier",
            "Follow up on shared interests before switching topics"
        ])
        eval_better_responses = json.dumps([
            {"type": "Casual", "text": "Hey Alex! Love the energy here. Are you local or in town for the meetup?"},
            {"type": "Confident", "text": "Nice to meet you Alex! I've been working on conversational AI tools and wanted to connect with other builders."},
            {"type": "Friendly", "text": "Hi Alex! Great to meet you. It's my first time at this mixer, what's been your favorite part so far?"}
        ])
        cursor.execute(
            """INSERT INTO evaluations 
               (id, session_id, overall_score, skills_json, strengths_json, improvements_json, better_responses_json, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', '-2 hours'))""",
            ("eval_sample_101", sample_session_id, 8.5, eval_skills, eval_strengths, eval_improvements, eval_better_responses)
        )

    conn.commit()
    conn.close()
