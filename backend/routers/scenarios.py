import json
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Query, Depends, Header
from pydantic import BaseModel
from models import ScenarioResponse
from database import get_db_connection
from auth import decode_access_token
from ai_service import generate_scenarios_openrouter

router = APIRouter(prefix="/api/scenarios", tags=["Scenarios"])

class ScenarioGenerateRequest(BaseModel):
    skill_id: str

def get_optional_user_id(authorization: Optional[str] = Header(None)) -> str:
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        try:
            payload = decode_access_token(token)
            if payload.get("sub"):
                return payload["sub"]
        except Exception:
            pass
    return "usr_123"

@router.get("", response_model=List[ScenarioResponse])
def get_scenarios(skill_id: Optional[str] = Query(None, description="Filter scenarios by skill_id")):
    """
    Returns available practice scenarios.
    Can be filtered by skill_id (e.g. /api/scenarios?skill_id=communication).
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if skill_id:
        cursor.execute("SELECT * FROM scenarios WHERE skill_id = ?", (skill_id.strip().lower(),))
    else:
        cursor.execute("SELECT * FROM scenarios")
        
    rows = cursor.fetchall()
    conn.close()
    
    scenarios: List[ScenarioResponse] = []
    for r in rows:
        tags = []
        try:
            tags = json.loads(r["character_tags"])
        except Exception:
            tags = [r["character_tags"]]
            
        scenarios.append(ScenarioResponse(
            id=r["id"],
            skill_id=r["skill_id"],
            title=r["title"],
            description=r["description"],
            character_name=r["character_name"],
            character_role=r["character_role"],
            character_status=r["character_status"],
            character_tags=tags,
            avatar_url=r["avatar_url"]
        ))
        
    return scenarios

@router.post("/generate", response_model=List[ScenarioResponse])
def generate_dynamic_scenarios(
    req: ScenarioGenerateRequest,
    user_id: str = Depends(get_optional_user_id)
):
    """
    Generates 3 dynamic, personalized practice scenarios taking into account
    the user's past simulation performance and difficulty level in that skill.
    """
    skill_clean = req.skill_id.strip().lower()
    conn = get_db_connection()
    cursor = conn.cursor()

    # Fetch past session evaluation metrics for this skill & user
    cursor.execute("""
        SELECT s.difficulty, e.overall_score, e.strengths_json, e.improvements_json
        FROM sessions s
        JOIN evaluations e ON s.id = e.session_id
        JOIN scenarios sc ON s.scenario_id = sc.id
        WHERE s.user_id = ? AND sc.skill_id = ?
    """, (user_id, skill_clean))
    past_rows = cursor.fetchall()

    past_stats = {
        "total_sessions": len(past_rows),
        "avg_score": 7.5,
        "strengths": [],
        "improvements": []
    }

    if past_rows:
        scores = [r["overall_score"] for r in past_rows if r["overall_score"]]
        if scores:
            past_stats["avg_score"] = round(sum(scores) / len(scores), 1)
        for r in past_rows:
            try:
                if r["strengths_json"]:
                    past_stats["strengths"].extend(json.loads(r["strengths_json"]))
                if r["improvements_json"]:
                    past_stats["improvements"].extend(json.loads(r["improvements_json"]))
            except Exception:
                pass

    skill_name = skill_clean.replace("-", " ").title()

    # Call AI Service to generate 3 dynamic scenarios
    generated = generate_scenarios_openrouter(skill_clean, skill_name, past_stats)

    # Persist generated scenarios in SQLite DB so they can be referenced during simulation
    scenarios_response: List[ScenarioResponse] = []
    for item in generated:
        tags_json = json.dumps(item["character_tags"]) if isinstance(item["character_tags"], list) else json.dumps([str(item["character_tags"])])
        
        cursor.execute("""
            INSERT OR REPLACE INTO scenarios
            (id, skill_id, title, description, character_name, character_role, character_status, character_tags, avatar_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            item["id"],
            skill_clean,
            item["title"],
            item["description"],
            item["character_name"],
            item["character_role"],
            item.get("character_status", "Online"),
            tags_json,
            item["avatar_url"]
        ))
        
        scenarios_response.append(ScenarioResponse(
            id=item["id"],
            skill_id=skill_clean,
            title=item["title"],
            description=item["description"],
            character_name=item["character_name"],
            character_role=item["character_role"],
            character_status=item.get("character_status", "Online"),
            character_tags=item["character_tags"] if isinstance(item["character_tags"], list) else [str(item["character_tags"])],
            avatar_url=item["avatar_url"]
        ))

    conn.commit()
    conn.close()

    return scenarios_response

@router.get("/{scenario_id}", response_model=ScenarioResponse)
def get_scenario_by_id(scenario_id: str):
    """
    Returns details for a specific scenario by id.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM scenarios WHERE id = ?", (scenario_id.strip().lower(),))
    r = cursor.fetchone()
    conn.close()
    
    if not r:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scenario with id '{scenario_id}' was not found."
        )
        
    tags = []
    try:
        tags = json.loads(r["character_tags"])
    except Exception:
        tags = [r["character_tags"]]
        
    return ScenarioResponse(
        id=r["id"],
        skill_id=r["skill_id"],
        title=r["title"],
        description=r["description"],
        character_name=r["character_name"],
        character_role=r["character_role"],
        character_status=r["character_status"],
        character_tags=tags,
        avatar_url=r["avatar_url"]
    )

