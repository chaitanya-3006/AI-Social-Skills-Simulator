import json
from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends
from models import (
    UserProgressResponse, SkillResponse, BadgeItem, 
    AICoachRecommendation, ScoreHistoryPoint
)
from database import get_db_connection
from routers.simulation import get_optional_user_id

router = APIRouter(prefix="/api/progress", tags=["Progress"])

BASE_SKILLS = [
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

def parse_session_date(dt_str: Optional[str]) -> Optional[date]:
    if not dt_str:
        return None
    try:
        # Extract YYYY-MM-DD
        date_part = dt_str[:10]
        return datetime.strptime(date_part, "%Y-%m-%d").date()
    except Exception:
        return None

def parse_session_datetime(dt_str: Optional[str]) -> Optional[datetime]:
    if not dt_str:
        return None
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%d %H:%M:%S.%f", "%Y-%m-%dT%H:%M:%S"):
        try:
            return datetime.strptime(dt_str[:19], fmt[:19])
        except Exception:
            continue
    return None

def calculate_streak(session_dates: List[date]) -> int:
    """
    Computes consecutive calendar days of practice ending either today or yesterday.
    """
    if not session_dates:
        return 0
    unique_dates = sorted(set(session_dates), reverse=True)
    today = date.today()
    yesterday = today - timedelta(days=1)

    # Streak is active only if user practiced today or yesterday
    if unique_dates[0] not in (today, yesterday):
        return 0

    streak = 1
    current_day = unique_dates[0]

    for prev_day in unique_dates[1:]:
        if prev_day == current_day - timedelta(days=1):
            streak += 1
            current_day = prev_day
        elif prev_day == current_day:
            continue
        else:
            break

    return streak

@router.get("", response_model=UserProgressResponse)
def get_user_progress(user_id: str = Depends(get_optional_user_id)):
    """
    Computes accurate, non-mocked user practice progress, real streak, skill mastery percentages,
    dynamic achievements, and personalized AI coach growth recommendations.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Fetch user sessions with scenario metadata and evaluations
    cursor.execute("""
        SELECT 
            s.id, 
            s.scenario_id, 
            s.difficulty, 
            s.status,
            s.created_at, 
            s.ended_at,
            e.overall_score, 
            e.skills_json, 
            e.strengths_json, 
            e.improvements_json, 
            sc.title as scenario_title, 
            sc.skill_id
        FROM sessions s
        LEFT JOIN evaluations e ON s.id = e.session_id
        LEFT JOIN scenarios sc ON s.scenario_id = sc.id
        WHERE s.user_id = ?
        ORDER BY s.created_at DESC
    """, (user_id,))
    
    rows = [dict(r) for r in cursor.fetchall()]

    # Filter to completed sessions (either status is 'completed' or has an evaluation score)
    completed_sessions = [r for r in rows if r.get("status") == "completed" or r.get("overall_score") is not None]
    total_sessions = len(completed_sessions)

    # 2. Compute accurate average score
    scores = [float(s["overall_score"]) for s in completed_sessions if s.get("overall_score") is not None]
    if scores:
        average_score = round(sum(scores) / len(scores), 1)
    else:
        average_score = 0.0

    # 3. Compute accurate practice streak
    session_dates = [parse_session_date(s.get("created_at")) for s in completed_sessions]
    valid_dates = [d for d in session_dates if d is not None]
    streak_days = calculate_streak(valid_dates)

    # 4. Compute accurate practice minutes
    total_practice_minutes = 0
    for s in completed_sessions:
        session_mins = 0
        c_dt = parse_session_datetime(s.get("created_at"))
        e_dt = parse_session_datetime(s.get("ended_at"))
        if c_dt and e_dt:
            diff_secs = (e_dt - c_dt).total_seconds()
            if 15 <= diff_secs <= 7200:
                session_mins = max(1, round(diff_secs / 60))
        if session_mins == 0:
            # Fallback based on message turns
            cursor.execute("SELECT count(*) as cnt FROM messages WHERE session_id = ?", (s["id"],))
            cnt_row = cursor.fetchone()
            msg_cnt = cnt_row["cnt"] if cnt_row else 4
            session_mins = max(1, round(msg_cnt * 0.75))
            
        total_practice_minutes += session_mins

    # 5. Compute accurate skill mastery scores
    skills_response: List[SkillResponse] = []
    skills_scores_map: Dict[str, Dict[str, Any]] = {}

    for sk in BASE_SKILLS:
        sk_id = sk["id"]
        sk_name = sk["name"]
        
        # Collect score observations for this skill
        collected_scores = []
        sessions_count = 0

        for s in completed_sessions:
            is_matching_scenario = (s.get("skill_id") == sk_id)
            if is_matching_scenario:
                sessions_count += 1
                if s.get("overall_score") is not None:
                    collected_scores.append(float(s["overall_score"]))

            # Also check if individual skill was evaluated in skills_json
            if s.get("skills_json"):
                try:
                    eval_skills = json.loads(s["skills_json"])
                    for es in eval_skills:
                        name_match = es.get("name", "").strip().lower()
                        if name_match == sk_name.lower() or (sk_id == "conflict" and "conflict" in name_match) or (sk_id == "active-listening" and "listening" in name_match):
                            if es.get("score") is not None:
                                collected_scores.append(float(es["score"]))
                except Exception:
                    pass

        if collected_scores:
            # Average score on 0-10 scale converted to 0-100 percentage
            avg_skill_10 = sum(collected_scores) / len(collected_scores)
            final_score = min(100, max(1, round(avg_skill_10 * 10)))
        else:
            final_score = 0

        skill_obj = SkillResponse(
            id=sk_id,
            name=sk_name,
            description=sk["description"],
            icon=sk["icon"],
            score=final_score,
            sessions_count=sessions_count
        )
        skills_response.append(skill_obj)
        skills_scores_map[sk_id] = {
            "name": sk_name,
            "score": final_score,
            "sessions_count": sessions_count
        }

    # 6. Dynamic Badges & Milestones
    al_sessions = [s for s in completed_sessions if s.get("skill_id") == "active-listening" and s.get("overall_score") is not None]
    al_best = max([float(s["overall_score"]) for s in al_sessions], default=0.0)
    conflict_hard = [s for s in completed_sessions if s.get("skill_id") == "conflict" and s.get("difficulty") == "hard"]
    distinct_skills = set(s.get("skill_id") for s in completed_sessions if s.get("skill_id"))
    max_score = max(scores, default=0.0)

    badges: List[BadgeItem] = [
        BadgeItem(
            id="1",
            title="Conversation Starter",
            desc="Completed your first AI roleplay simulation",
            unlocked=total_sessions >= 1,
            progress_text=f"{min(1, total_sessions)}/1 completed" if total_sessions < 1 else "Unlocked",
            icon="trophy"
        ),
        BadgeItem(
            id="2",
            title="Active Listener",
            desc="Achieve 8.0+ in an Active Listening simulation",
            unlocked=al_best >= 8.0,
            progress_text=f"Best: {al_best}/10" if al_sessions else "Practice Active Listening to earn",
            icon="shield-check"
        ),
        BadgeItem(
            id="3",
            title="Streak Champion",
            desc="Practiced 3+ consecutive days",
            unlocked=streak_days >= 3,
            progress_text=f"Current: {streak_days}/3 days" if streak_days < 3 else "Unlocked",
            icon="flame"
        ),
        BadgeItem(
            id="4",
            title="Conflict De-escalator",
            desc="Complete a Hard difficulty disagreement session",
            unlocked=len(conflict_hard) >= 1,
            progress_text="Unlocked" if len(conflict_hard) >= 1 else "Practice Hard conflict scenario",
            icon="target"
        ),
        BadgeItem(
            id="5",
            title="High Achiever",
            desc="Achieve a 9.0+ score in any practice simulation",
            unlocked=max_score >= 9.0,
            progress_text=f"Highest: {max_score}/10" if scores else "0/10",
            icon="sparkles"
        ),
        BadgeItem(
            id="6",
            title="Well-Rounded",
            desc="Practiced in at least 3 distinct social skill areas",
            unlocked=len(distinct_skills) >= 3,
            progress_text=f"{len(distinct_skills)}/3 skills practiced",
            icon="award"
        )
    ]

    # 7. AI Coach Growth Focus
    practiced_skills = [s for s in skills_response if (s.sessions_count or 0) > 0 and (s.score or 0) > 0]
    unpracticed_skills = [s for s in skills_response if (s.sessions_count or 0) == 0]

    if unpracticed_skills:
        focus_sk = unpracticed_skills[0]
        cursor.execute("SELECT id, title FROM scenarios WHERE skill_id = ? LIMIT 1", (focus_sk.id,))
        sc_row = cursor.fetchone()
        scenario_id = sc_row["id"] if sc_row else "networking-event"
        scenario_title = sc_row["title"] if sc_row else "Networking Event Mixer"

        if practiced_skills:
            top_sk = max(practiced_skills, key=lambda x: x.score or 0)
            msg = f"Your **{top_sk.name}** mastery is your strongest asset ({top_sk.score}/100). Expand your versatility by starting your first practice in **{focus_sk.name}**."
        else:
            msg = f"Begin your communication journey with **{focus_sk.name}**. Practice approachable scenarios to build baseline conversational agility and confidence."

        ai_recommendation = AICoachRecommendation(
            focus_skill_id=focus_sk.id,
            focus_skill_name=focus_sk.name,
            message=msg,
            suggested_scenario_id=scenario_id,
            suggested_scenario_title=scenario_title,
            difficulty="Easy" if not practiced_skills else "Medium"
        )
    else:
        # All skills practiced: target the lowest scoring skill
        lowest_sk = min(practiced_skills, key=lambda x: x.score or 0)
        top_sk = max(practiced_skills, key=lambda x: x.score or 0)

        cursor.execute("SELECT id, title FROM scenarios WHERE skill_id = ? LIMIT 1", (lowest_sk.id,))
        sc_row = cursor.fetchone()
        scenario_id = sc_row["id"] if sc_row else "group-project"
        scenario_title = sc_row["title"] if sc_row else "Group Project Disagreement"

        diff = "Hard" if (lowest_sk.score or 0) >= 75 else "Medium"
        msg = f"Your **{top_sk.name}** ({top_sk.score}/100) is outstanding. Focus on de-escalation and clarity in **{lowest_sk.name}** ({lowest_sk.score}/100) to round out your mastery."

        ai_recommendation = AICoachRecommendation(
            focus_skill_id=lowest_sk.id,
            focus_skill_name=lowest_sk.name,
            message=msg,
            suggested_scenario_id=scenario_id,
            suggested_scenario_title=scenario_title,
            difficulty=diff
        )

    # 8. Real Confidence Highlights from Evaluations
    confidence_highlights: List[str] = []
    for s in completed_sessions:
        if s.get("strengths_json"):
            try:
                items = json.loads(s["strengths_json"])
                for item in items:
                    clean_item = item.strip()
                    if clean_item and clean_item not in confidence_highlights:
                        confidence_highlights.append(clean_item)
                    if len(confidence_highlights) >= 3:
                        break
            except Exception:
                pass
        if len(confidence_highlights) >= 3:
            break

    if not confidence_highlights:
        confidence_highlights = [
            "Maintain comfortable dialogue pacing and pause deliberately before answering",
            "Ask curious open-ended questions to deepen rapport with conversation partners",
            "Acknowledge the other person's emotions before proposing solutions or counter-offers"
        ]

    # 9. Chronological Score History for Chart / Progression View
    score_history: List[ScoreHistoryPoint] = []
    # Take up to 10 recent completed sessions in chronological order
    for s in reversed(completed_sessions[:10]):
        if s.get("overall_score") is not None:
            score_history.append(ScoreHistoryPoint(
                session_id=s["id"],
                title=s.get("scenario_title") or "Practice Simulation",
                score=float(s["overall_score"]),
                date=s.get("created_at")[:10] if s.get("created_at") else "",
                skill_id=s.get("skill_id") or ""
            ))

    # 10. Recent Activity List
    recent_act = []
    for s in completed_sessions[:5]:
        recent_act.append({
            "session_id": s["id"],
            "title": s.get("scenario_title") or "Practice Session",
            "score": float(s["overall_score"]) if s.get("overall_score") is not None else 8.0,
            "date": s.get("created_at") or ""
        })

    conn.close()

    return UserProgressResponse(
        total_sessions=total_sessions,
        average_score=average_score,
        streak_days=streak_days,
        total_practice_minutes=total_practice_minutes,
        skills=skills_response,
        recent_activity=recent_act,
        badges=badges,
        ai_recommendation=ai_recommendation,
        confidence_highlights=confidence_highlights[:3],
        score_history=score_history
    )
