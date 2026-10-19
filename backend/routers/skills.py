import json
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Depends
from models import SkillResponse
from database import get_db_connection
from routers.simulation import get_optional_user_id

router = APIRouter(prefix="/api/skills", tags=["Skills"])

BASE_SKILLS_META = [
    {
        "id": "communication",
        "name": "Communication",
        "description": "Practice expressing your thoughts clearly and persuasively",
        "icon": "message-circle"
    },
    {
        "id": "confidence",
        "name": "Confidence",
        "description": "Practice speaking with assurance, presence, and conviction",
        "icon": "mic"
    },
    {
        "id": "active-listening",
        "name": "Active Listening",
        "description": "Understand nuances, validate feelings, and respond thoughtfully",
        "icon": "ear"
    },
    {
        "id": "small-talk",
        "name": "Small Talk",
        "description": "Navigate casual social interactions and build effortless rapport",
        "icon": "users"
    },
    {
        "id": "conflict",
        "name": "Conflict Handling",
        "description": "De-escalate tension, resolve disagreements, and find common ground",
        "icon": "shield-alert"
    }
]

@router.get("", response_model=List[SkillResponse])
def get_skills(user_id: str = Depends(get_optional_user_id)):
    """
    Returns all available social skills with accurately calculated scores for the current user.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # Query completed sessions for user
    cursor.execute("""
        SELECT s.scenario_id, sc.skill_id, e.overall_score, e.skills_json
        FROM sessions s
        JOIN scenarios sc ON s.scenario_id = sc.id
        LEFT JOIN evaluations e ON s.id = e.session_id
        WHERE s.user_id = ? AND (s.status = 'completed' OR e.overall_score IS NOT NULL)
    """, (user_id,))
    
    sessions = cursor.fetchall()
    conn.close()

    result: List[SkillResponse] = []
    for sk in BASE_SKILLS_META:
        sk_id = sk["id"]
        sk_name = sk["name"]
        collected_scores = []
        sessions_count = 0

        for s in sessions:
            if s["skill_id"] == sk_id:
                sessions_count += 1
                if s["overall_score"] is not None:
                    collected_scores.append(float(s["overall_score"]))
            
            if s["skills_json"]:
                try:
                    eval_skills = json.loads(s["skills_json"])
                    for es in eval_skills:
                        name_match = es.get("name", "").strip().lower()
                        if name_match == sk_name.lower():
                            if es.get("score") is not None:
                                collected_scores.append(float(es["score"]))
                except Exception:
                    pass

        if collected_scores:
            avg_10 = sum(collected_scores) / len(collected_scores)
            final_score = min(100, max(1, round(avg_10 * 10)))
        else:
            final_score = 0

        result.append(SkillResponse(
            id=sk_id,
            name=sk_name,
            description=sk["description"],
            icon=sk["icon"],
            score=final_score,
            sessions_count=sessions_count
        ))

    return result

@router.get("/{skill_id}", response_model=SkillResponse)
def get_skill(skill_id: str, user_id: str = Depends(get_optional_user_id)):
    """
    Gets details about one specific skill.
    """
    skills = get_skills(user_id)
    skill_clean = skill_id.strip().lower()
    for s in skills:
        if s.id.lower() == skill_clean:
            return s
            
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Skill with id '{skill_id}' was not found."
    )
