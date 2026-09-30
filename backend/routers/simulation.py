import time
import json
import random
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, status, Depends, Header
from models import (
    StartSimulationRequest, StartSimulationResponse,
    ChatMessageRequest, MessageResponse,
    EndSimulationRequest, EndSimulationResponse,
    EvaluationResponse, EvaluationSkillScore, BetterResponseItem
)
from database import get_db_connection
from auth import decode_access_token
from ai_service import (
    generate_character_reply_openrouter,
    generate_evaluation_report_openrouter
)

router = APIRouter(prefix="/api", tags=["Simulation"])

def get_optional_user_id(authorization: Optional[str] = Header(None)) -> str:
    """Extracts user_id from Bearer token if present, otherwise defaults to demo user."""
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        try:
            payload = decode_access_token(token)
            if payload.get("sub"):
                return payload["sub"]
        except Exception:
            pass
    return "usr_123"

def generate_initial_greeting(scenario: Dict[str, Any], difficulty: str) -> str:
    char_name = scenario["character_name"]
    char_role = scenario["character_role"]
    scenario_id = scenario["id"]
    
    if scenario_id == "networking-event":
        return f"Hi there! I don't think we've met yet. I'm {char_name}, studying computer science. What brings you to this mixer?"
    elif scenario_id == "salary-negotiation":
        return f"Hello! Thanks for taking the time to discuss the offer. As you know, we're very excited about bringing you onto the team as a {char_role}. Have you had a chance to review the package?"
    elif scenario_id == "group-project":
        if difficulty == "hard":
            return f"Look, I know we need to finish this project, but I've had three midterms this week. What do you want me to do?"
        return f"Hey, sorry I've been a bit behind on the project tasks. What parts are we still missing?"
    elif scenario_id == "active-listening-friend":
        return f"Hey... thanks for grabbing coffee with me. Honestly, I've just been feeling super overwhelmed with our sprint deliverables lately."
    elif scenario_id == "clear-presentation":
        return f"Thanks for setting up this meeting. I have about ten minutes before my next sync. Walk me through what you're proposing and why we should prioritize it."
    
    return f"Hi there! I'm {char_name}. How's everything going with you today?"

# =========================================================================
# Endpoints
# =========================================================================

@router.post("/simulation/start", response_model=StartSimulationResponse)
def start_simulation(
    req: StartSimulationRequest,
    user_id: str = Depends(get_optional_user_id)
):
    """
    Initializes a new practice simulation session and creates the AI character greeting.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Verify scenario exists
    cursor.execute("SELECT * FROM scenarios WHERE id = ?", (req.scenario_id,))
    scenario = cursor.fetchone()
    if not scenario:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scenario '{req.scenario_id}' does not exist."
        )
        
    session_id = f"session_{int(time.time() * 1000)}"
    diff = req.difficulty.lower() if req.difficulty in ["easy", "medium", "hard"] else "medium"
    
    # Create session record
    cursor.execute(
        "INSERT INTO sessions (id, user_id, scenario_id, difficulty, status) VALUES (?, ?, ?, ?, ?)",
        (session_id, user_id, req.scenario_id, diff, "started")
    )
    
    # Generate initial character greeting
    greeting_content = generate_initial_greeting(dict(scenario), diff)
    msg_id = f"msg_{int(time.time() * 1000)}_ai"
    
    cursor.execute(
        "INSERT INTO messages (id, session_id, role, content) VALUES (?, ?, ?, ?)",
        (msg_id, session_id, "ai", greeting_content)
    )
    
    conn.commit()
    conn.close()
    
    return StartSimulationResponse(
        session_id=session_id,
        status="started",
        initial_message={
            "id": msg_id,
            "role": "ai",
            "content": greeting_content,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }
    )

@router.post("/chat", response_model=MessageResponse)
def send_chat_message(req: ChatMessageRequest):
    """
    Receives a user message and returns the dynamic AI persona's reply powered by OpenRouter LLM.
    """
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message content cannot be empty.")
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check session
    cursor.execute("""
        SELECT s.*, sc.title, sc.description as scenario_description, sc.character_name, sc.character_role, sc.character_tags, sc.id as scenario_slug
        FROM sessions s
        JOIN scenarios sc ON s.scenario_id = sc.id
        WHERE s.id = ?
    """, (req.session_id,))
    session = cursor.fetchone()
    if not session:
        conn.close()
        raise HTTPException(status_code=404, detail="Session not found.")
        
    # Save user message
    user_msg_id = f"msg_{int(time.time() * 1000)}_user"
    cursor.execute(
        "INSERT INTO messages (id, session_id, role, content) VALUES (?, ?, ?, ?)",
        (user_msg_id, req.session_id, "user", req.message.strip())
    )
    
    # Fetch conversation history
    cursor.execute("SELECT * FROM messages WHERE session_id = ? ORDER BY timestamp ASC", (req.session_id,))
    history = [dict(m) for m in cursor.fetchall()]
    
    # Generate AI response via OpenRouter LLM
    scenario_dict = {
        "id": session["scenario_slug"],
        "title": session["title"],
        "description": session["scenario_description"],
        "character_name": session["character_name"],
        "character_role": session["character_role"],
        "character_tags": session["character_tags"]
    }
    ai_content = generate_character_reply_openrouter(
        scenario_dict,
        session["difficulty"],
        req.message.strip(),
        history
    )
    
    ai_msg_id = f"msg_{int(time.time() * 1000) + 1}_ai"
    cursor.execute(
        "INSERT INTO messages (id, session_id, role, content) VALUES (?, ?, ?, ?)",
        (ai_msg_id, req.session_id, "ai", ai_content)
    )
    
    conn.commit()
    conn.close()
    
    return MessageResponse(
        id=ai_msg_id,
        session_id=req.session_id,
        role="ai",
        content=ai_content,
        timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    )

@router.post("/simulation/end", response_model=EndSimulationResponse)
def end_simulation(req: EndSimulationRequest):
    """
    Finalizes a simulation session and generates the qualitative AI evaluation report via OpenRouter.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT s.*, sc.title, sc.description as scenario_description, sc.character_name
        FROM sessions s
        JOIN scenarios sc ON s.scenario_id = sc.id
        WHERE s.id = ?
    """, (req.session_id,))
    session = cursor.fetchone()
    if not session:
        conn.close()
        raise HTTPException(status_code=404, detail="Session not found.")
        
    # Mark completed
    cursor.execute(
        "UPDATE sessions SET status = 'completed', ended_at = CURRENT_TIMESTAMP WHERE id = ?",
        (req.session_id,)
    )
    
    # Fetch all messages
    cursor.execute("SELECT * FROM messages WHERE session_id = ? ORDER BY timestamp ASC", (req.session_id,))
    messages = [dict(m) for m in cursor.fetchall()]
    
    scenario_dict = {
        "title": session["title"],
        "description": session["scenario_description"],
        "character_name": session["character_name"]
    }
    
    # Generate comprehensive evaluation report via OpenRouter
    eval_data = generate_evaluation_report_openrouter(
        scenario_dict,
        session["difficulty"],
        messages
    )
    
    eval_id = f"eval_{int(time.time() * 1000)}"
    cursor.execute("""
        INSERT OR REPLACE INTO evaluations 
        (id, session_id, overall_score, skills_json, strengths_json, improvements_json, better_responses_json)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        eval_id,
        req.session_id,
        eval_data.get("overall_score", 8.4),
        json.dumps(eval_data.get("skills", [])),
        json.dumps(eval_data.get("what_you_did_well", [])),
        json.dumps(eval_data.get("areas_to_improve", [])),
        json.dumps(eval_data.get("better_responses", []))
    ))
    
    conn.commit()
    conn.close()
    
    return EndSimulationResponse(
        success=True,
        session_id=req.session_id
    )

@router.get("/evaluation/{session_id}", response_model=EvaluationResponse)
def get_evaluation(session_id: str):
    """
    Fetches the AI evaluation report for a completed session.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM evaluations WHERE session_id = ?", (session_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Evaluation for session '{session_id}' not found."
        )
        
    return EvaluationResponse(
        overall_score=row["overall_score"],
        skills=[EvaluationSkillScore(**s) for s in json.loads(row["skills_json"])],
        what_you_did_well=json.loads(row["strengths_json"]),
        areas_to_improve=json.loads(row["improvements_json"]),
        better_responses=[BetterResponseItem(**r) for r in json.loads(row["better_responses_json"])]
    )
