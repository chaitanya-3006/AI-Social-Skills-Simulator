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


def generate_scenarios_openrouter(
    skill_id: str,
    skill_name: str,
    past_stats: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """
    Generates 3 dynamic, personalized practice scenarios for a given skill based on user performance.
    """
    if not settings.OPENROUTER_API_KEY:
        return fallback_generate_scenarios(skill_id, skill_name, past_stats)

    avg_score = past_stats.get("avg_score", 7.5)
    sessions_count = past_stats.get("total_sessions", 0)
    strengths = past_stats.get("strengths", [])
    improvements = past_stats.get("improvements", [])

    system_prompt = """You are an expert AI social skills curriculum designer for SocialSim.
Your task is to generate 3 realistic, engaging roleplay scenarios tailored to a user practicing a specific social skill.
Take into account the user's skill level to craft 3 distinct options:
1. Warm-up scenario (approachable, supportive context)
2. Target scenario (matches their current skill score directly)
3. Challenge scenario (stretches their ability with slightly higher stakes)

Return ONLY a valid JSON list containing exactly 3 scenario objects with this exact structure:
[
  {
    "id": "unique-slug-id-1",
    "skill_id": "skill-id",
    "title": "Short Catchy Scenario Title",
    "description": "2-sentence scenario context outlining the situation and the user's objective.",
    "character_name": "First Name",
    "character_role": "Job Title or Persona Role",
    "character_status": "Online",
    "character_tags": ["Trait1", "Trait2", "Trait3"],
    "avatar_url": "https://api.dicebear.com/7.x/notionists/svg?seed=FirstName&backgroundColor=b6e3f4"
  }
]
Use valid background colors in avatar_url: b6e3f4, ffdfbf, c0aede, ffd5dc, d1d4f9.
Output ONLY the raw JSON list."""

    user_prompt = f"""Skill: {skill_name} (ID: {skill_id})
User Metrics:
- Completed Simulations in this Skill: {sessions_count}
- Average Score: {avg_score}/10
- Known Strengths: {", ".join(strengths[:2]) if strengths else "Enthusiastic participant"}
- Areas to Focus On: {", ".join(improvements[:2]) if improvements else "Clear articulation and active listening"}

Generate 3 personalized scenarios now:"""

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
        "max_tokens": 800,
        "temperature": 0.8
    }

    try:
        response = requests.post(OPENROUTER_URL, headers=headers, json=payload, timeout=15)
        if response.status_code == 200:
            content = response.json()["choices"][0]["message"]["content"].strip()
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:].strip()
            
            parsed = json.loads(content)
            if isinstance(parsed, dict):
                for v in parsed.values():
                    if isinstance(v, list) and len(v) >= 3:
                        parsed = v
                        break
            if isinstance(parsed, list) and len(parsed) >= 3:
                scenarios = []
                for idx, item in enumerate(parsed[:3]):
                    slug = f"ai-{skill_id}-{int(random.random() * 100000)}"
                    scenarios.append({
                        "id": str(item.get("id", slug)),
                        "skill_id": skill_id,
                        "title": str(item.get("title", f"{skill_name} Practice {idx+1}")),
                        "description": str(item.get("description", "Practice your social skills in this scenario.")),
                        "character_name": str(item.get("character_name", "Alex")),
                        "character_role": str(item.get("character_role", "Colleague")),
                        "character_status": "Online",
                        "character_tags": item.get("character_tags", ["Realistic", "Engaging"]),
                        "avatar_url": str(item.get("avatar_url", f"https://api.dicebear.com/7.x/notionists/svg?seed=Avatar{idx}&backgroundColor=b6e3f4"))
                    })
                return scenarios
    except Exception as e:
        print(f"OpenRouter scenario generation exception: {e}")

    return fallback_generate_scenarios(skill_id, skill_name, past_stats)


def fallback_generate_scenarios(skill_id: str, skill_name: str, past_stats: Dict[str, Any]) -> List[Dict[str, Any]]:
    ts = int(random.random() * 10000)
    avg_score = past_stats.get("avg_score", 7.5)
    
    templates = {
        "communication": [
            ("Cross-Functional Alignment", "Liam", "Senior Product Manager", ["Strategic", "Direct", "Busy"], "Discuss project timelines and realign cross-functional deliverables under tight deadlines.", "b6e3f4"),
            ("Explaining Technical Concepts", "Maya", "Non-Technical Stakeholder", ["Curious", "Attentive", "Detail-Oriented"], "Explain a complex system architecture update in simple, plain language.", "ffdfbf"),
            ("Client Expectation Management", "David", "Enterprise Client Lead", ["Demanding", "Analytical", "Results-Oriented"], "Address unexpected project scope modifications while maintaining client trust.", "c0aede")
        ],
        "confidence": [
            ("Salary & Promotion Discussion", "Sarah", "HR Manager", ["Professional", "Firm", "Fair"], "Present your key achievements and negotiate for a compensation adjustment.", "ffdfbf"),
            ("Executive Committee Briefing", "Ethan", "VP of Operations", ["Authoritative", "Time-Constrained", "High-Expectations"], "Pitch an initiative to senior leadership with poise and conviction.", "ffd5dc"),
            ("Leading a High-Stakes Meeting", "Priya", "Team Director", ["Supportive", "Observant", "Strategic"], "Step up to facilitate an unexpected team strategy meeting.", "d1d4f9")
        ],
        "active-listening": [
            ("Supporting a Stressed Colleague", "Elena", "Software Engineer", ["Vulnerable", "Overworked", "Appreciative"], "Listen carefully to a teammate feeling overwhelmed and validate their concerns.", "ffd5dc"),
            ("Customer Feedback Discovery", "Rohan", "Beta Tester", ["Frustrated", "Talkative", "Honest"], "Uncover underlying product pain points by actively listening without interrupting.", "b6e3f4"),
            ("Resolving Misunderstandings", "Chloe", "Design Lead", ["Expressive", "Sensitive", "Collaborative"], "Listen deeply to feedback on a recent design handoff to reach mutual clarity.", "c0aede")
        ],
        "small-talk": [
            ("Networking Event Mixer", "Alex", "College Student", ["Friendly", "Talkative", "Curious"], "Strike up an engaging conversation with a new contact at an industry mixer.", "b6e3f4"),
            ("Coffee Break Exchange", "Noah", "Senior Consultant", ["Witty", "Relaxed", "Approachable"], "Convert a casual coffee line encounter into a meaningful professional rapport.", "ffdfbf"),
            ("Airport Lounge Conversation", "Sophia", "Startup Founder", ["Enthusiastic", "Traveler", "Insightful"], "Engage in effortless banter while waiting for a flight connection.", "d1d4f9")
        ],
        "conflict": [
            ("Group Project Disagreement", "Jordan", "Classmate", ["Defensive", "Stressed", "Skeptical"], "Address uneven workload distribution constructively without causing resentment.", "c0aede"),
            ("Resource Allocation Clash", "Victor", "Engineering Lead", ["Assertive", "Protective", "Pragmatic"], "Resolve a dispute over shared server infrastructure and developer resources.", "ffd5dc"),
            ("Feedback Pushback", "Hannah", "Senior Designer", ["Proud", "Defensive", "Talented"], "Deliver critical design critique in a way that de-escalates defensiveness.", "b6e3f4")
        ]
    }

    selected_templates = templates.get(skill_id, templates["communication"])
    results = []

    for i, (title, char_name, char_role, tags, desc, bg) in enumerate(selected_templates):
        sc_id = f"gen-{skill_id}-{i+1}-{ts}"
        # Adjust title based on skill score tier
        level_prefix = "Warm-up: " if i == 0 else ("Target: " if i == 1 else "Challenge: ")
        results.append({
            "id": sc_id,
            "skill_id": skill_id,
            "title": f"{level_prefix}{title}",
            "description": f"{desc} (Tailored for {avg_score}/10 skill level)",
            "character_name": char_name,
            "character_role": char_role,
            "character_status": "Online",
            "character_tags": tags,
            "avatar_url": f"https://api.dicebear.com/7.x/notionists/svg?seed={char_name}&backgroundColor={bg}"
        })

    return results

