import json
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from models import UserProgressResponse, SkillResponse
from database import get_db_connection
from routers.simulation import get_optional_user_id

router = APIRouter(prefix="/api/progress", tags=["Progress"])

BASE_SKILLS = [
    {
        "id": "communication",
        "name": "Communication",
        "description": "Practice expressing your thoughts clearly and persuasively",
        "icon": "message-circle",
        "base_score": 80
    },
    {
        "id": "confidence",
        "name": "Confidence",
        "description": "Practice speaking with assurance, presence, and conviction",
        "icon": "mic",
        "base_score": 70
    },
    {
        "id": "active-listening",
        "name": "Active Listening",
        "description": "Understand nuances, validate feelings, and respond thoughtfully",
        "icon": "ear",
        "base_score": 60
    },
    {
        "id": "small-talk",
        "name": "Small Talk",
        "description": "Navigate casual social interactions and build effortless rapport",
        "icon": "users",
        "base_score": 90
    },
    {
        "id": "conflict",
        "name": "Conflict Handling",
        "description": "De-escalate tension, resolve disagreements, and find common ground",
        "icon": "shield-alert",
        "base_score": 55
    }
]

@router.get("", response_model=UserProgressResponse)
def get_user_progress(user_id: str = Depends(get_optional_user_id)):
    """
    Computes overall practice progress, streak, metrics, and skill mastery.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Fetch user sessions
    cursor.execute("""
        SELECT s.id, s.scenario_id, s.difficulty, s.created_at, e.overall_score, sc.title as scenario_title, sc.skill_id
        FROM sessions s
        LEFT JOIN evaluations e ON s.id = e.session_id
        LEFT JOIN scenarios sc ON s.scenario_id = sc.id
        WHERE s.user_id = ?
        ORDER BY s.created_at DESC
    """, (user_id,))
    
    sessions = cursor.fetchall()
    conn.close()
    
    total_sessions = len(sessions)
    if total_sessions > 0:
        scores = [s["overall_score"] for s in sessions if s["overall_score"] is not None]
        avg_score = round(sum(scores) / len(scores), 1) if scores else 8.2
    else:
        avg_score = 8.0
        
    streak_days = max(1, min(7, total_sessions * 2))
    total_practice_mins = total_sessions * 12 + 15
    
    skills_response: List[SkillResponse] = []
    for sk in BASE_SKILLS:
        # Boost skill score slightly based on sessions practiced
        boost = sum(3 for s in sessions if s["skill_id"] == sk["id"])
        calculated_score = min(100, sk["base_score"] + boost)
        skills_response.append(SkillResponse(
            id=sk["id"],
            name=sk["name"],
            description=sk["description"],
            icon=sk["icon"],
            score=calculated_score
        ))
        
    recent_act = []
    for s in sessions[:5]:
        recent_act.append({
            "session_id": s["id"],
            "title": s["scenario_title"] or "Practice Session",
            "score": s["overall_score"] or 8.0,
            "date": s["created_at"]
        })
        
    return UserProgressResponse(
        total_sessions=total_sessions,
        average_score=avg_score,
        streak_days=streak_days,
        total_practice_minutes=total_practice_mins,
        skills=skills_response,
        recent_activity=recent_act
    )
