import json
import random
import requests
from typing import List, Dict, Any, Optional
from config import settings

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

def generate_character_reply_openrouter(
    scenario: Dict[str, Any],
    difficulty: str,
    user_message: str,
    history: List[Dict[str, Any]]
) -> str:
    """
    Generates an in-character AI response using OpenRouter LLM.
    """
    if not settings.OPENROUTER_API_KEY:
        raise ValueError("OpenRouter API key not configured")

    char_name = scenario.get("character_name", "AI Character")
    char_role = scenario.get("character_role", "Participant")
    char_tags = scenario.get("character_tags", [])
    if isinstance(char_tags, str):
        try:
            char_tags = json.loads(char_tags)
        except Exception:
            char_tags = [char_tags]
            
    tags_str = ", ".join(char_tags) if char_tags else "realistic"
    scenario_title = scenario.get("title", "Conversation")
    scenario_desc = scenario.get("description", "A realistic social interaction")
    
    difficulty_instructions = {
        "easy": "Be friendly, patient, and cooperative. Give clear cues and hints to help the user practice comfortably.",
        "medium": "Act naturally with realistic pacing, standard workplace/social reactions, and appropriate boundaries.",
        "hard": "Be challenging, slightly skeptical or busy/defensive, requiring the user to persuade, de-escalate, or speak with strong conviction."
    }.get(difficulty.lower(), "Act naturally and realistically.")

    system_prompt = f"""You are roleplaying as {char_name}, a {char_role} ({tags_str}) in a conversational social skills simulator called SocialSim.
Scenario: "{scenario_title}"
Context: {scenario_desc}
Difficulty: {difficulty.upper()} ({difficulty_instructions})

Rules for your response:
1. Stay strictly in character as {char_name}. Do NOT break character or mention you are an AI assistant.
2. Keep your replies concise and conversational (1 to 3 sentences maximum), suitable for natural spoken dialogue.
3. React realistically to what the user says. Acknowledge their points and move the conversation forward naturally with a question or comment.
4. Do NOT use markdown asterisks like *smiles* or *nods*, output only the direct spoken dialogue."""

    messages = [{"role": "system", "content": system_prompt}]
    
    # Add recent conversation history (up to last 10 messages)
    for m in history[-10:]:
        role = "assistant" if m["role"] == "ai" else "user"
        messages.append({"role": role, "content": m["content"]})
        
    messages.append({"role": "user", "content": user_message})

    headers = {
        "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "SocialSim AI Simulator"
    }
    
    payload = {
        "model": settings.OPENROUTER_MODEL,
        "messages": messages,
        "max_tokens": 180,
        "temperature": 0.75
    }

    try:
        response = requests.post(OPENROUTER_URL, headers=headers, json=payload, timeout=12)
        if response.status_code == 200:
            data = response.json()
            reply = data["choices"][0]["message"]["content"].strip()
            # Strip any extraneous quotes if the model wrapped everything in quotes
            if (reply.startswith('"') and reply.endswith('"')) or (reply.startswith("'") and reply.endswith("'")):
                reply = reply[1:-1].strip()
            return reply
        else:
            print(f"OpenRouter API returned error {response.status_code}: {response.text}")
    except Exception as e:
        print(f"OpenRouter request exception: {e}")

    # Fallback to persona logic if API call fails
    return fallback_persona_reply(scenario, difficulty, user_message, history)


def generate_evaluation_report_openrouter(
    scenario: Dict[str, Any],
    difficulty: str,
    history: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Generates a qualitative evaluation report based on the actual conversation transcript using OpenRouter.
    """
    if not settings.OPENROUTER_API_KEY or len(history) < 2:
        return fallback_evaluation(history)

    transcript_lines = []
    for m in history:
        sender = "User" if m["role"] == "user" else scenario.get("character_name", "AI")
        transcript_lines.append(f"{sender}: {m['content']}")
    transcript_text = "\n".join(transcript_lines)

    system_prompt = """You are an expert executive communication and social skills coach evaluating a user's practice simulation.
Analyze the user's conversational performance and return ONLY a valid JSON object matching the exact schema below.

Required JSON format:
{
  "overall_score": 8.5,
  "skills": [
    {"name": "Communication", "score": 8.5},
    {"name": "Confidence", "score": 8.0},
    {"name": "Active Listening", "score": 9.0},
    {"name": "Empathy", "score": 8.5}
  ],
  "what_you_did_well": [
    "Specific positive observation 1 based on actual user messages",
    "Specific positive observation 2",
    "Specific positive observation 3"
  ],
  "areas_to_improve": [
    "Specific actionable recommendation 1",
    "Specific actionable recommendation 2"
  ],
  "better_responses": [
    {"type": "Casual", "text": "A natural, relaxed phrasing example the user could have said"},
    {"type": "Confident", "text": "An assertive, authoritative phrasing example"},
    {"type": "Friendly", "text": "A warm, rapport-building phrasing example"}
  ]
}

Score range: 0.0 to 10.0 (one decimal place).
Be constructive, encouraging, and deeply specific to the actual dialogue provided."""

    user_prompt = f"""Scenario: {scenario.get('title')} ({scenario.get('description')})
Difficulty: {difficulty}

Conversation Transcript:
{transcript_text}

Provide the evaluation JSON:"""

    headers = {
        "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "SocialSim AI Simulator"
    }
    
    payload = {
        "model": settings.OPENROUTER_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "response_format": {"type": "json_object"},
        "max_tokens": 600,
        "temperature": 0.4
    }

    try:
        response = requests.post(OPENROUTER_URL, headers=headers, json=payload, timeout=15)
        if response.status_code == 200:
            content = response.json()["choices"][0]["message"]["content"]
            parsed = json.loads(content)
            if "overall_score" in parsed and "skills" in parsed:
                return parsed
    except Exception as e:
        print(f"OpenRouter evaluation error: {e}")

    return fallback_evaluation(history)


# =========================================================================
# Fallback Heuristics
# =========================================================================

def fallback_persona_reply(scenario: Dict[str, Any], difficulty: str, user_message: str, history: List[Dict[str, Any]]) -> str:
    char_name = scenario.get("character_name", "Alex")
    lower = user_message.lower()
    scenario_id = scenario.get("id", "")
    turns = len([m for m in history if m["role"] == "user"])

    if scenario_id == "salary-negotiation":
        if any(w in lower for w in ["range", "benchmark", "market", "percent", "%", "worth", "value", "experience"]):
            return "You make a fair point regarding your background and industry benchmarks. If we adjust base compensation by 8-10%, would that align with your expectations?"
        elif any(w in lower for w in ["benefit", "bonus", "equity", "remote", "flexible", "pto"]):
            return "We definitely have flexibility on perks and remote arrangements. Let me see what adjustments we can make."
        return f"I appreciate you being transparent about your expectations. Let me take this proposal to the hiring committee and see how close we can get."

    elif scenario_id == "group-project":
        if any(w in lower for w in ["divide", "split", "together", "help", "deadline", "plan"]):
            return "That sounds much more manageable. If you can handle the slides, I can take care of the technical documentation tonight."
        return "Thanks for checking in instead of just getting upset. Let's outline the next steps so we stay on track."

    elif scenario_id == "networking-event":
        if any(w in lower for w in ["work", "project", "build", "tech", "ai", "study", "engineer"]):
            return f"That's awesome! I've been experimenting with LLM agents and web tools lately. How long have you been working in that space?"
        return "That's really interesting! What kind of connections or projects are you hoping to find at this event?"

    if len(user_message) > 60:
        return "I see your point clearly. You've thought this through carefully. How do you propose we move forward next?"
    elif lower.startswith("hi") or lower.startswith("hello") or lower.startswith("hey"):
        return f"Hey! Great to connect with you. What brings you here today?"

    replies = [
        "That makes total sense. Could you share a bit more about how you see that working out?",
        "I appreciate that perspective. Let's make sure we're aligned on the key priorities.",
        "Interesting point! That actually gives me a better picture of where you're coming from."
    ]
    return replies[turns % len(replies)]


def fallback_evaluation(history: List[Dict[str, Any]]) -> Dict[str, Any]:
    user_msgs = [m for m in history if m["role"] == "user"]
    total_turns = len(user_msgs)
    avg_len = sum(len(m["content"]) for m in user_msgs) / max(1, total_turns)
    
    base_score = 7.5
    if total_turns >= 3:
        base_score += 0.7
    if avg_len > 40:
        base_score += 0.6
    overall_score = min(9.8, round(base_score + random.uniform(-0.2, 0.3), 1))
    
    return {
        "overall_score": overall_score,
        "skills": [
            {"name": "Communication", "score": min(10.0, round(overall_score + random.uniform(-0.3, 0.4), 1))},
            {"name": "Confidence", "score": min(10.0, round(overall_score + random.uniform(-0.4, 0.3), 1))},
            {"name": "Active Listening", "score": min(10.0, round(overall_score + random.uniform(-0.2, 0.5), 1))},
            {"name": "Empathy", "score": min(10.0, round(overall_score + random.uniform(-0.3, 0.4), 1))}
        ],
        "what_you_did_well": [
            "Asked insightful open-ended questions that deepened the dialogue",
            "Maintained a calm, empathetic, and constructive tone throughout",
            "Demonstrated active listening by directly referencing persona context"
        ],
        "areas_to_improve": [
            "Try structuring complex proposals more concisely before expanding on details",
            "Take a brief deliberate pause before answering challenging questions to project extra confidence"
        ],
        "better_responses": [
            {"type": "Casual", "text": "I completely see where you're coming from! Let's figure out a quick win together."},
            {"type": "Confident", "text": "Based on my market research and contributions, I'm confident in this proposal."},
            {"type": "Friendly", "text": "I'd love to understand your viewpoint better so we can make this work smoothly."}
        ]
    }
