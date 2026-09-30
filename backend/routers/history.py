import json
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Depends
from models import SessionHistoryItem, SessionHistoryDetailResponse, MessageResponse, EvaluationResponse, EvaluationSkillScore, BetterResponseItem
from database import get_db_connection
from routers.simulation import get_optional_user_id

router = APIRouter(prefix="/api/history", tags=["History"])

@router.get("", response_model=List[SessionHistoryItem])
def get_user_history(user_id: str = Depends(get_optional_user_id)):
    """
    Returns list of all completed simulation sessions for the user.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT 
            s.id,
            s.scenario_id,
            s.difficulty,
            s.created_at,
            sc.title as scenario_title,
            sc.skill_id,
            sc.character_name,
            sc.avatar_url,
            COALESCE(e.overall_score, 7.5) as score
        FROM sessions s
        JOIN scenarios sc ON s.scenario_id = sc.id
        LEFT JOIN evaluations e ON s.id = e.session_id
        WHERE s.user_id = ?
        ORDER BY s.created_at DESC
    """, (user_id,))
    
    rows = cursor.fetchall()
    conn.close()
    
    skill_names = {
        "communication": "Communication",
        "confidence": "Confidence",
        "active-listening": "Active Listening",
        "small-talk": "Small Talk",
        "conflict": "Conflict Handling"
    }
    
    history: List[SessionHistoryItem] = []
    for r in rows:
        history.append(SessionHistoryItem(
            id=r["id"],
            scenario_id=r["scenario_id"],
            scenario_title=r["scenario_title"],
            skill_id=r["skill_id"],
            skill_name=skill_names.get(r["skill_id"], r["skill_id"].capitalize()),
            difficulty=r["difficulty"],
            date=r["created_at"],
            score=round(r["score"], 1),
            character_name=r["character_name"],
            avatar_url=r["avatar_url"]
        ))
        
    return history

@router.get("/{session_id}", response_model=SessionHistoryDetailResponse)
def get_session_history_detail(session_id: str):
    """
    Returns full transcript and evaluation report for a past session.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT 
            s.id,
            s.scenario_id,
            s.difficulty,
            s.created_at,
            sc.title as scenario_title,
            sc.skill_id
        FROM sessions s
        JOIN scenarios sc ON s.scenario_id = sc.id
        WHERE s.id = ?
    """, (session_id,))
    session = cursor.fetchone()
    if not session:
        conn.close()
        raise HTTPException(status_code=404, detail="Session not found.")
        
    # Messages
    cursor.execute("SELECT * FROM messages WHERE session_id = ? ORDER BY timestamp ASC", (session_id,))
    messages_rows = cursor.fetchall()
    messages = [
        MessageResponse(
            id=m["id"],
            session_id=m["session_id"],
            role=m["role"],
            content=m["content"],
            timestamp=m["timestamp"]
        )
        for m in messages_rows
    ]
    
    # Evaluation
    cursor.execute("SELECT * FROM evaluations WHERE session_id = ?", (session_id,))
    eval_row = cursor.fetchone()
    eval_resp = None
    if eval_row:
        eval_resp = EvaluationResponse(
            overall_score=eval_row["overall_score"],
            skills=[EvaluationSkillScore(**s) for s in json.loads(eval_row["skills_json"])],
            what_you_did_well=json.loads(eval_row["strengths_json"]),
            areas_to_improve=json.loads(eval_row["improvements_json"]),
            better_responses=[BetterResponseItem(**r) for r in json.loads(eval_row["better_responses_json"])]
        )
        
    conn.close()
    
    skill_names = {
        "communication": "Communication",
        "confidence": "Confidence",
        "active-listening": "Active Listening",
        "small-talk": "Small Talk",
        "conflict": "Conflict Handling"
    }
    
    return SessionHistoryDetailResponse(
        id=session["id"],
        scenario_id=session["scenario_id"],
        scenario_title=session["scenario_title"],
        skill_id=session["skill_id"],
        skill_name=skill_names.get(session["skill_id"], session["skill_id"].capitalize()),
        difficulty=session["difficulty"],
        date=session["created_at"],
        messages=messages,
        evaluation=eval_resp
    )
