from typing import Optional, List
from pydantic import BaseModel, EmailStr

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
