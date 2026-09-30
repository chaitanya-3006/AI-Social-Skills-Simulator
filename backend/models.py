from typing import Optional, List, Dict, Any
from pydantic import BaseModel

# Auth Schemas
class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

class RegisterResponse(BaseModel):
    user_id: str
    name: str
    email: str

class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserResponse(BaseModel):
    id: str
    name: str
    email: str

# Skill Schemas
class SkillResponse(BaseModel):
    id: str
    name: str
    description: str
    icon: Optional[str] = None
    score: Optional[int] = None

# Scenario Schemas
class ScenarioResponse(BaseModel):
    id: str
    skill_id: str
    title: str
    description: str
    character_name: str
    character_role: str
    character_status: str
    character_tags: List[str]
    avatar_url: str

# Simulation & Chat Schemas
class StartSimulationRequest(BaseModel):
    scenario_id: str
    difficulty: str

class StartSimulationResponse(BaseModel):
    session_id: str
    status: str
    initial_message: Optional[Dict[str, Any]] = None

class ChatMessageRequest(BaseModel):
    session_id: str
    message: str

class MessageResponse(BaseModel):
    id: str
    session_id: Optional[str] = None
    role: str
    content: str
    timestamp: str

class EndSimulationRequest(BaseModel):
    session_id: str

class EndSimulationResponse(BaseModel):
    success: bool
    session_id: str

# Evaluation Schemas
class EvaluationSkillScore(BaseModel):
    name: str
    score: float

class BetterResponseItem(BaseModel):
    type: str
    text: str

class EvaluationResponse(BaseModel):
    overall_score: float
    skills: List[EvaluationSkillScore]
    what_you_did_well: List[str]
    areas_to_improve: List[str]
    better_responses: List[BetterResponseItem]

# History Schemas
class SessionHistoryItem(BaseModel):
    id: str
    scenario_id: str
    scenario_title: str
    skill_id: str
    skill_name: str
    difficulty: str
    date: str
    score: float
    character_name: str
    avatar_url: str

class SessionHistoryDetailResponse(BaseModel):
    id: str
    scenario_id: str
    scenario_title: str
    skill_id: str
    skill_name: str
    difficulty: str
    date: str
    messages: List[MessageResponse]
    evaluation: Optional[EvaluationResponse] = None

# Progress Schemas
class UserProgressResponse(BaseModel):
    total_sessions: int
    average_score: float
    streak_days: int
    total_practice_minutes: int
    skills: List[SkillResponse]
    recent_activity: List[Dict[str, Any]]

# User Profile Update
class UserProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    default_difficulty: Optional[str] = None
