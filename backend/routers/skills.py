from typing import List
from fastapi import APIRouter, HTTPException, status
from models import SkillResponse

router = APIRouter(prefix="/api/skills", tags=["Skills"])

# In-memory skills catalog matching frontend specifications
SKILLS_CATALOG: List[SkillResponse] = [
    SkillResponse(
        id="communication",
        name="Communication",
        description="Practice expressing your thoughts clearly and persuasively",
        icon="message-circle",
        score=80
    ),
    SkillResponse(
        id="confidence",
        name="Confidence",
        description="Practice speaking with assurance, presence, and conviction",
        icon="mic",
        score=70
    ),
    SkillResponse(
        id="active-listening",
        name="Active Listening",
        description="Understand nuances, validate feelings, and respond thoughtfully",
        icon="ear",
        score=60
    ),
    SkillResponse(
        id="small-talk",
        name="Small Talk",
        description="Navigate casual social interactions and build effortless rapport",
        icon="users",
        score=90
    ),
    SkillResponse(
        id="conflict",
        name="Conflict Handling",
        description="De-escalate tension, resolve disagreements, and find common ground",
        icon="shield-alert",
        score=55
    ),
]

@router.get("", response_model=List[SkillResponse])
def get_skills():
    """
    Returns all available social skills.
    Used by /practice/skill and the Dashboard.
    """
    return SKILLS_CATALOG

@router.get("/{skill_id}", response_model=SkillResponse)
def get_skill(skill_id: str):
    """
    Gets details about one specific skill.
    """
    skill_clean = skill_id.strip().lower()
    for skill in SKILLS_CATALOG:
        if skill.id.lower() == skill_clean:
            return skill
            
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Skill with id '{skill_id}' was not found."
    )
