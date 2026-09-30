import json
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Query
from models import ScenarioResponse
from database import get_db_connection

router = APIRouter(prefix="/api/scenarios", tags=["Scenarios"])

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
