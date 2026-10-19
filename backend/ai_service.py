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


SKILL_DISPLAY_NAMES = {
    "communication": "Communication",
    "confidence": "Confidence",
    "active-listening": "Active Listening",
    "small-talk": "Small Talk",
    "conflict": "Conflict Handling"
}

def generate_evaluation_report_openrouter(
    scenario: Dict[str, Any],
    difficulty: str,
    history: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Generates a qualitative evaluation report based on the actual conversation transcript using OpenRouter.
    """
    skill_id = scenario.get("skill_id", "communication")
    target_skill_name = SKILL_DISPLAY_NAMES.get(skill_id, "Communication")

    if not settings.OPENROUTER_API_KEY or len(history) < 2:
        return fallback_evaluation(history, scenario, difficulty)

    transcript_lines = []
    for m in history:
        sender = "User" if m["role"] == "user" else scenario.get("character_name", "AI")
        transcript_lines.append(f"{sender}: {m['content']}")
    transcript_text = "\n".join(transcript_lines)

    system_prompt = f"""You are an expert executive communication and social skills coach evaluating a user's practice simulation.
The user is practicing the target social skill: '{target_skill_name}' in a roleplay scenario titled '{scenario.get('title', 'Simulation')}'.
Difficulty setting: {difficulty}.

Analyze the user's conversational performance and return ONLY a valid JSON object matching the exact schema below.

CRITICAL SCORING & CALIBRATION RULES (DO NOT INFLATE SCORES):
- 0.0 - 2.5: Low-effort or conversational dead-end. (e.g., user replied with only 1 brief, passive sentence like 'yes u are right about that', 'ok', 'cool', 'I agree', or sent < 10 total words and ended the session). If the user provided zero insight, zero questions, and gave a 1-sentence dead-end, the overall_score MUST BE between 1.5 and 2.5 / 10. NEVER award 5.0+ to a 1-sentence dead-end.
- 2.6 - 4.0: Minimal or prematurely abandoned engagement (1-2 very brief turns, passive agreement, no follow-up questions or elaboration).
- 4.1 - 6.0: Basic reactive dialogue (2-3 turns, replies are on-topic but lack depth, initiative, or engaging follow-up).
- 6.1 - 7.9: Solid competent performance (3+ substantive turns, clear articulation, addresses the persona's points thoughtfully).
- 8.0 - 8.9: Advanced mastery (4+ active turns, insightful questions, empathetic validation, high composure and value articulation).
- 9.0 - 10.0: Outstanding executive mastery.

Required JSON format:
{{
  "overall_score": 8.4,
  "skills": [
    {{"name": "{target_skill_name}", "score": 8.5}},
    {{"name": "Communication", "score": 8.2}},
    {{"name": "Active Listening", "score": 8.8}},
    {{"name": "Confidence", "score": 8.0}}
  ],
  "what_you_did_well": [
    "Specific positive observation 1 quoting or referencing actual user words",
    "Specific positive observation 2",
    "Specific positive observation 3"
  ],
  "areas_to_improve": [
    "Specific actionable recommendation 1",
    "Specific actionable recommendation 2"
  ],
  "better_responses": [
    {{"type": "Casual", "text": "A natural, relaxed phrasing example the user could have said"}},
    {{"type": "Confident", "text": "An assertive, authoritative phrasing example"}},
    {{"type": "Friendly", "text": "A warm, rapport-building phrasing example"}}
  ]
}}

Output ONLY the raw JSON object."""

    user_prompt = f"""Scenario: {scenario.get('title')} ({scenario.get('description')})
Target Skill: {target_skill_name}
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
        "max_tokens": 700,
        "temperature": 0.2
    }

    try:
        response = requests.post(OPENROUTER_URL, headers=headers, json=payload, timeout=15)
        if response.status_code == 200:
            content = response.json()["choices"][0]["message"]["content"]
            parsed = json.loads(content)
            if "overall_score" in parsed and "skills" in parsed:
                # Ensure overall score is float with 1 decimal
                parsed["overall_score"] = round(float(parsed["overall_score"]), 1)
                for s in parsed["skills"]:
                    s["score"] = round(float(s["score"]), 1)

                # Programmatic validation guard against LLM polite score inflation for low-effort sessions
                user_msgs = [m for m in history if m.get("role") == "user"]
                total_turns = len(user_msgs)
                all_user_text = " ".join(m.get("content", "") for m in user_msgs).strip()
                total_words = len(all_user_text.split())

                if total_turns == 1 and total_words <= 8:
                    # Single brief dead-end (e.g. "yes u are right about that")
                    parsed["overall_score"] = min(2.5, parsed["overall_score"])
                    for s in parsed["skills"]:
                        s["score"] = min(2.8, s["score"])
                    if not any("dead-end" in imp.lower() or "brief" in imp.lower() or "effort" in imp.lower() for imp in parsed.get("areas_to_improve", [])):
                        parsed.setdefault("areas_to_improve", []).insert(0, f"Your response ('{all_user_text}') was an abrupt conversational dead-end (only {total_words} words) that offered zero personal insight, opinion, or follow-up.")
                elif total_turns == 1 and total_words <= 18:
                    parsed["overall_score"] = min(3.8, parsed["overall_score"])
                    for s in parsed["skills"]:
                        s["score"] = min(4.2, s["score"])
                elif total_turns == 1:
                    parsed["overall_score"] = min(4.5, parsed["overall_score"])
                    for s in parsed["skills"]:
                        s["score"] = min(5.0, s["score"])
                elif total_turns == 2 and total_words <= 12:
                    parsed["overall_score"] = min(4.2, parsed["overall_score"])
                    for s in parsed["skills"]:
                        s["score"] = min(4.8, s["score"])

                return parsed
    except Exception as e:
        print(f"OpenRouter evaluation error: {e}")

    return fallback_evaluation(history, scenario, difficulty)


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


def fallback_evaluation(
    history: List[Dict[str, Any]], 
    scenario: Optional[Dict[str, Any]] = None,
    difficulty: str = "medium"
) -> Dict[str, Any]:
    scenario = scenario or {}
    skill_id = scenario.get("skill_id", "communication")
    target_skill_name = SKILL_DISPLAY_NAMES.get(skill_id, "Communication")
    
    user_msgs = [m for m in history if m.get("role") == "user"]
    total_turns = len(user_msgs)
    
    if total_turns == 0:
        return {
            "overall_score": 1.0,
            "skills": [
                {"name": target_skill_name, "score": 1.0},
                {"name": "Communication", "score": 1.0},
                {"name": "Active Listening", "score": 1.0},
                {"name": "Confidence", "score": 1.0}
            ],
            "what_you_did_well": ["Session started"],
            "areas_to_improve": ["No user messages were sent. Send messages to practice your communication skills."],
            "better_responses": [
                {"type": "Casual", "text": "Hi there! Looking forward to discussing this together."},
                {"type": "Confident", "text": "Hello, thank you for meeting with me today. Let's get right into our agenda."},
                {"type": "Friendly", "text": "Hey! Great to connect with you today, hope your week is going smoothly."}
            ]
        }

    all_user_text = " ".join(m.get("content", "") for m in user_msgs).strip()
    words = all_user_text.split()
    total_words = len(words)
    avg_words = total_words / total_turns
    lower_text = all_user_text.lower()
    
    # 1. Single-turn evaluation (Strict penalty for dead-ends and premature termination)
    if total_turns == 1:
        if total_words <= 8:
            overall_score = 2.2
            comm_score = 2.0
            listening_score = 2.5
            conf_score = 2.0
            target_score = 2.0
            strengths = ["Acknowledged the speaker's comment politely"]
            improvements = [
                f"Your response ('{all_user_text}') was an abrupt conversational dead-end (only {total_words} words) that offered zero personal insight, opinion, or follow-up.",
                "A successful conversation requires active participation—ask open-ended questions and continue the exchange for at least 3-4 turns."
            ]
        elif total_words <= 18:
            overall_score = 3.5
            comm_score = 3.2
            listening_score = 3.8
            conf_score = 3.0
            target_score = 3.2
            strengths = ["Initiated a polite response addressing the prompt"]
            improvements = [
                "The session was ended prematurely after just one short message before any real dialogue could develop.",
                "Continue the dialogue across multiple exchanges and share concrete details."
            ]
        else:
            overall_score = 4.2
            comm_score = 4.5
            listening_score = 4.0
            conf_score = 4.0
            target_score = 4.2
            strengths = ["Provided a substantive initial perspective"]
            improvements = [
                "The roleplay was terminated after only one turn before reaching any resolution.",
                "Practice navigating follow-ups, counter-arguments, and mutual alignment across multiple turns."
            ]
            
        better_responses = [
            {"type": "Casual", "text": "I completely see what you mean! Though personally, I'm curious what specific trends you're watching closest right now?"},
            {"type": "Confident", "text": "You're spot on about the market volatility. Given how fast things move, my focus has been on algorithmic resilience and liquidity shifts."},
            {"type": "Friendly", "text": "Haha, absolutely! It's hard not to feel that buzz in here. Are you presenting on fintech or following any particular breakthroughs today?"}
        ]

        return {
            "overall_score": overall_score,
            "skills": [
                {"name": target_skill_name, "score": target_score},
                {"name": "Communication", "score": comm_score},
                {"name": "Active Listening", "score": listening_score},
                {"name": "Confidence", "score": conf_score}
            ],
            "what_you_did_well": strengths,
            "areas_to_improve": improvements,
            "better_responses": better_responses
        }

    # 2. Multi-turn Base Score calculation
    if total_turns >= 4:
        base = 6.2
    elif total_turns == 3:
        base = 5.0
    else: # 2 turns
        base = 3.5
        
    if avg_words >= 20:
        base += 1.2
    elif avg_words >= 12:
        base += 0.8
    elif avg_words >= 7:
        base += 0.3
    elif avg_words < 5:
        base -= 1.0

    # 3. Inquisitiveness (Active Listening bonus)
    question_count = all_user_text.count("?")
    question_bonus = min(0.8, question_count * 0.4)
    
    # 4. Empathy and Courtesy bonus
    courtesy_words = ["thank", "appreciate", "understand", "agree", "makes sense", "hear you", "perspective", "sorry", "glad", "curious", "feel"]
    courtesy_hits = sum(1 for w in courtesy_words if w in lower_text)
    courtesy_bonus = min(0.6, courtesy_hits * 0.2)
    
    # 5. Domain / skill alignment bonus
    domain_bonus = 0.0
    if skill_id == "conflict":
        if any(w in lower_text for w in ["compromise", "resolve", "align", "together", "work", "solution", "calm", "priority"]):
            domain_bonus += 0.7
    elif skill_id == "confidence":
        if any(w in lower_text for w in ["market", "benchmark", "value", "experience", "result", "deliver", "proposal", "goals"]):
            domain_bonus += 0.7
    elif skill_id == "small-talk":
        if any(w in lower_text for w in ["project", "curious", "interesting", "weekend", "work", "where", "how long"]):
            domain_bonus += 0.7
    elif skill_id == "active-listening":
        if any(w in lower_text for w in ["sounds like", "feel", "frustrating", "hear", "tell me more", "how are you"]):
            domain_bonus += 0.7
    elif skill_id == "communication":
        if any(w in lower_text for w in ["specifically", "recommend", "next steps", "objective", "first", "second"]):
            domain_bonus += 0.7

    diff_penalty = 0.4 if difficulty == "hard" else (0.0 if difficulty == "medium" else -0.3)
    
    overall_score = max(1.5, min(9.8, round(base + question_bonus + courtesy_bonus + domain_bonus - diff_penalty, 1)))
    
    # Component skills
    comm_score = max(1.5, min(10.0, round(overall_score + (0.3 if avg_words >= 12 else -0.5), 1)))
    listening_score = max(1.5, min(10.0, round(overall_score + question_bonus + courtesy_bonus - 0.2, 1)))
    conf_score = max(1.5, min(10.0, round(overall_score + (0.4 if total_turns >= 4 else -0.4), 1)))
    target_score = max(1.5, min(10.0, round(overall_score + domain_bonus - 0.1, 1)))

    # Strengths and improvements
    strengths = []
    if total_turns >= 4:
        strengths.append(f"Maintained steady conversational momentum across {total_turns} full dialogue turns")
    if courtesy_hits > 0:
        strengths.append("Demonstrated professional empathy and acknowledged the other party's perspective")
    if question_count > 0:
        strengths.append("Asked thoughtful clarifying questions to keep the dialogue constructive")
    if not strengths:
        strengths.append("Maintained a polite and respectful tone throughout")
    if len(strengths) < 3:
        strengths.append("Kept communication open and collaborative during the scenario")

    improvements = []
    if avg_words < 12:
        improvements.append("Expand on your responses with more context, analysis, and depth instead of brief statements")
    if question_count == 0:
        improvements.append("Incorporate open-ended questions to invite the other person to share their viewpoint")
    if total_turns < 3:
        improvements.append("Continue the exchange for at least 3-4 turns to reach a deeper resolution")
    if not improvements:
        improvements.append("Experiment with higher difficulty levels to test your skills in more tense scenarios")

    better_responses = [
        {"type": "Casual", "text": "I completely see where you're coming from! Let's figure out a quick win together."},
        {"type": "Confident", "text": "Based on my background and what we need to accomplish, I'm confident in this approach."},
        {"type": "Friendly", "text": "I'd love to understand your viewpoint better so we can make this work smoothly for everyone."}
    ]

    return {
        "overall_score": overall_score,
        "skills": [
            {"name": target_skill_name, "score": target_score},
            {"name": "Communication", "score": comm_score},
            {"name": "Active Listening", "score": listening_score},
            {"name": "Confidence", "score": conf_score}
        ],
        "what_you_did_well": strengths[:3],
        "areas_to_improve": improvements[:2],
        "better_responses": better_responses
    }



SKILL_DIVERSITY_SPECS = {
    "communication": {
        "focus": "executive briefings, technical-to-nontechnical translation, public hearings, project stake pitches, crisis messaging",
        "banned": "coffee shop, coffee line, casual cafeteria chat, generic networking mixer, college mixer",
        "sample_contexts": [
            "Emergency cyber breach briefing to non-technical hospital directors",
            "Pitching an automated smart-transit logistics pilot to a skeptical city council",
            "Explaining complex machine learning reliability boundaries to a chief medical officer",
            "Cross-functional launch handover to a tired night-shift orbital operations controller",
            "Rebranding town hall persuading traditional regional franchise owners"
        ]
    },
    "confidence": {
        "focus": "assertiveness, self-advocacy, high-stakes negotiations, boundary setting, holding ground under tough scrutiny",
        "banned": "coffee shop, coffee line, casual cafeteria chat, generic networking mixer, college mixer",
        "sample_contexts": [
            "Executive consulting retainer pitch ($25,000/mo) defending premium value without apologizing",
            "Challenging a high-ranking VP's technically flawed architecture in an executive review",
            "Pitching yourself to a skeptical engineering director for the Lead Autonomous Systems role",
            "Holding your ground on strict work-life boundaries with an aggressive, demanding client",
            "Defending a 40% enterprise price increase to a longtime legacy account lead"
        ]
    },
    "active-listening": {
        "focus": "empathy, uncovering unspoken grievances, distressed peer support, deep customer discovery, de-escalation",
        "banned": "coffee shop, coffee line, casual cafeteria chat, generic networking mixer, college mixer",
        "sample_contexts": [
            "High-value enterprise customer on the verge of churn venting about broken deployment promises",
            "1-on-1 with a top-performing developer suffering in silence from imposter syndrome and burnout",
            "Qualitative research discovery interview where a reserved user hides their true friction points",
            "Mediating passive-aggressive friction between remote team members across different time zones",
            "Blameless debrief counseling a distressed junior engineer whose bug caused a visible public outage"
        ]
    },
    "small-talk": {
        "focus": "spontaneous rapport, witty observational banter, charming curiosity, finding unexpected common ground with strangers",
        "banned": "coffee shop, coffee line, casual coffee chat, generic networking mixer, college mixer, water cooler",
        "sample_contexts": [
            "VIP speaker green room chatting with an eccentric keynote speaker before taking the stage",
            "Delayed transatlantic flight passenger lounge connecting with an investigative documentary filmmaker",
            "Modern art gallery preview discussing an enigmatic avant-garde installation with the sculptor",
            "Rooftop observatory night striking up engaging dialogue with a passionate astrophysicist",
            "Midnight indie film festival premiere line chatting with a virtual reality sound designer"
        ]
    },
    "conflict": {
        "focus": "de-escalation, addressing credit theft, vendor breach resolution, deadlock mediation, constructive pushback",
        "banned": "coffee shop, coffee line, casual cafeteria chat, generic networking mixer, college mixer",
        "sample_contexts": [
            "Production outage war room resolving a tense blame game between DevOps and Backend leads",
            "Co-founders locked in a deadlock over selling the startup vs remaining bootstrapped",
            "Confronting a peer coworker who presented your machine learning model as their sole work",
            "Offshore vendor contract breach holding engineering leadership accountable for missed milestones",
            "Heated design overhaul dispute where engineers modified UI tokens without designer consultation"
        ]
    }
}

RANDOM_INDUSTRIES = [
    "Biotechnology & Genomics", "Aerospace & Satellite Telemetry", "FinTech & Algorithmic Trading",
    "Independent Game Development", "Contemporary Art & Architecture", "Documentary Film & Media",
    "Environmental Robotics & Marine Science", "Autonomous Vehicle Infrastructure", "Luxury Industrial Design"
]

def generate_scenarios_openrouter(
    skill_id: str,
    skill_name: str,
    past_stats: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """
    Generates 3 dynamic, highly diverse, personalized practice scenarios for a given skill.
    Guarantees rich variety, distinct settings, and strictly bans generic repetitive tropes.
    """
    if not settings.OPENROUTER_API_KEY:
        return fallback_generate_scenarios(skill_id, skill_name, past_stats)

    avg_score = past_stats.get("avg_score", 7.5)
    sessions_count = past_stats.get("total_sessions", 0)
    strengths = past_stats.get("strengths", [])
    improvements = past_stats.get("improvements", [])

    spec = SKILL_DIVERSITY_SPECS.get(skill_id, SKILL_DIVERSITY_SPECS["communication"])
    industry_sample = random.sample(RANDOM_INDUSTRIES, 2)
    contexts_sample = random.sample(spec["sample_contexts"], min(2, len(spec["sample_contexts"])))

    system_prompt = f"""You are an elite conversational psychologist and roleplay curriculum designer for SocialSim.
Your task is to generate 3 DISTINCT, HIGHLY DIVERSE, IMMERSIVE roleplay scenarios specifically tailored to practicing the social skill: '{skill_name}'.

Core Skill Focus: {spec['focus']}

STRICT DIVERSITY CONSTRAINTS:
1. ABSOLUTELY BANNED TROPES: DO NOT generate any '{spec['banned']}'. Any coffee shop, coffee queue, or generic networking mixer is strictly forbidden.
2. Every scenario MUST feature a creative, realistic, specific setting with tangible stakes.
3. The 3 scenarios must offer progressive conversational friction:
   - Scenario 1 (Approachable / Warm-up): Warm, receptive persona in an interesting setting.
   - Scenario 2 (Target / Realistic Stakes): Professional or social setting matching user's ~{avg_score}/10 skill level.
   - Scenario 3 (Challenge / High Stakes): Time-sensitive, skeptical, or firm persona requiring high composure.
4. Each scenario must feature a distinct character name (use varied origins), specific job role, and 3 realistic personality tags.

Return ONLY a valid JSON list containing exactly 3 scenario objects with this exact schema:
[
  {{
    "id": "ai-{skill_id}-1-{int(random.random() * 10000)}",
    "skill_id": "{skill_id}",
    "title": "Short Vivid Title (4-6 words)",
    "description": "2-sentence scenario context establishing the exact setting, persona dynamic, and user's objective.",
    "character_name": "First Name",
    "character_role": "Specific Professional or Social Role",
    "character_status": "Online",
    "character_tags": ["Trait1", "Trait2", "Trait3"],
    "avatar_url": "https://api.dicebear.com/7.x/notionists/svg?seed=FirstName&backgroundColor=b6e3f4"
  }}
]
Avatar background colors must be chosen from: b6e3f4, ffdfbf, c0aede, ffd5dc, d1d4f9.
Output ONLY the raw JSON list."""

    user_prompt = f"""Skill: {skill_name} (ID: {skill_id})
User Experience: {sessions_count} past sessions completed, current score: {avg_score}/10.
Focus areas: {", ".join(improvements[:2]) if improvements else "Presence, active engagement, and persuasive delivery"}.

Inspiration settings for this generation:
- Sector inspiration: {industry_sample[0]} and {industry_sample[1]}.
- Context ideas: {contexts_sample[0]} OR {contexts_sample[1]}.

Generate 3 diverse, compelling, non-cliche scenarios now (remember: zero coffee shops or generic mixers):"""

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
        "max_tokens": 900,
        "temperature": 0.85
    }

    try:
        response = requests.post(OPENROUTER_URL, headers=headers, json=payload, timeout=16)
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
                bg_colors = ["b6e3f4", "ffdfbf", "c0aede", "ffd5dc", "d1d4f9"]
                for idx, item in enumerate(parsed[:3]):
                    slug = f"ai-{skill_id}-{int(random.random() * 100000)}"
                    char_name = str(item.get("character_name", f"Persona{idx+1}")).strip()
                    color = bg_colors[idx % len(bg_colors)]
                    avatar = str(item.get("avatar_url", ""))
                    if not avatar or "dicebear" not in avatar:
                        avatar = f"https://api.dicebear.com/7.x/notionists/svg?seed={char_name}&backgroundColor={color}"
                    
                    scenarios.append({
                        "id": str(item.get("id", slug)),
                        "skill_id": skill_id,
                        "title": str(item.get("title", f"{skill_name} Simulation {idx+1}")),
                        "description": str(item.get("description", "Practice your social skills in this scenario.")),
                        "character_name": char_name,
                        "character_role": str(item.get("character_role", "Colleague")),
                        "character_status": "Online",
                        "character_tags": item.get("character_tags", ["Realistic", "Engaging"]),
                        "avatar_url": avatar
                    })
                return scenarios
    except Exception as e:
        print(f"OpenRouter scenario generation exception: {e}")

    return fallback_generate_scenarios(skill_id, skill_name, past_stats)


# =========================================================================
# Rich Diverse Fallback Scenarios Catalog
# =========================================================================

DIVERSE_SCENARIO_POOLS = {
    "small-talk": [
        ("Alpine Express Dining Car", "Astrid", "Wildlife Documentary Filmmaker", ["Observant", "Well-Traveled", "Warm"], "You are sharing a table in a scenic alpine train dining car delayed by snowfall. Break the ice naturally and build rapport over shared travel observations.", "b6e3f4"),
        ("VIP Speaker Green Room", "Julian", "Keynote Astrophysicist", ["Eccentric", "Intellectual", "Witty"], "You are waiting in the speaker lounge before an international tech summit. Strike up an engaging conversation before either of you takes the main stage.", "c0aede"),
        ("Modern Sculpture Preview", "Kenji", "Avant-Garde Curator", ["Artistic", "Perceptive", "Curious"], "While viewing an enigmatic kinetic sculpture at a gallery opening, find common ground and exchange genuine aesthetic impressions.", "ffd5dc"),
        ("Rooftop Community Greenhouse", "Nadia", "Urban Botanist & Architect", ["Passionate", "Relaxed", "Inviting"], "Encounter a neighbor tending to heirloom plants in a shared rooftop garden at dusk. Transition from casual curiosity into engaging dialogue.", "ffdfbf"),
        ("Indie Game Showcase Line", "Leo", "Spatial Audio Designer", ["Enthusiastic", "Creative", "Tech-Savvy"], "Waiting in a packed line for a midnight virtual reality showcase, initiate lively banter about creative storytelling and sound design.", "d1d4f9"),
        ("Antique Bookstore Rare Archive", "Eleanor", "Historical Cartographer", ["Thoughtful", "Articulate", "Intrigued"], "Both browsing vintage astronomical maps in an old basement bookstore, strike up an effortless conversation about forgotten discoveries.", "b6e3f4"),
        ("Transatlantic Flight Layover", "Mateo", "Marine Biologist", ["Adventurous", "Good-Humored", "Open"], "Seated near a gate during a 3-hour layover, start a captivating exchange about international expeditions and unexpected detours.", "ffdfbf")
    ],
    "confidence": [
        ("High-Ticket Consulting Retainer", "Camilla", "Managing Director of Operations", ["Firm", "Calculating", "Discerning"], "You are pitching a $25,000/month transformation retainer. Stand firm on your premium value without hedging or apologizing for your price.", "ffdfbf"),
        ("Challenging a VP's Technical Plan", "Arthur", "VP of Engineering", ["Authoritative", "Impressionable", "Direct"], "In an executive review, intervene politely but resolutely to explain why a proposed rushed launch could cause massive outages.", "c0aede"),
        ("Pitching for Autonomous Systems Lead", "Helena", "Director of Product & R&D", ["Selective", "Strategic", "High-Expectations"], "Present your achievements with poised conviction and convince leadership you are ready to command the newly funded division.", "d1d4f9"),
        ("Hostile Podcast Cross-Examination", "Zack", "Investigative Tech Journalist", ["Probing", "Persistent", "Analytical"], "On a live industry broadcast, defend your controversial engineering architecture decisions calmly under rapid-fire questioning.", "ffd5dc"),
        ("Setting Firm Client Scope Boundaries", "Garrett", "Key Enterprise Account Lead", ["Demanding", "Assertive", "Impatient"], "Address a client who consistently messages your team at 11 PM demanding out-of-scope features without extra budget.", "b6e3f4"),
        ("Defending a 40% Pricing Adjustment", "Miriam", "Legacy Account Representative", ["Skeptical", "Cost-Conscious", "Fair"], "Present new contract terms with confident rationale, detailing how expanded capabilities justify the higher investment.", "ffdfbf")
    ],
    "conflict": [
        ("Production Outage Post-Mortem", "Viktor", "Site Reliability Lead", ["Defensive", "Exhausted", "Combative"], "A critical server crash caused downtime during peak hours. De-escalate a heated blame session between DevOps and Backend teams.", "ffd5dc"),
        ("Co-Founder Strategic Deadlock", "Sloan", "Technical Co-Founder", ["Stubborn", "Visionary", "Tense"], "Your startup is running low on runway. Resolve an existential deadlock on accepting venture funding versus remaining bootstrapped.", "c0aede"),
        ("Confronting Peer Credit Theft", "Damon", "Senior Product Manager", ["Polished", "Defensive", "Calculating"], "A peer presented your machine learning model slides in the executive showcase as their sole accomplishment. Address the breach with composure.", "b6e3f4"),
        ("Vendor Contract Milestone Breach", "Amara", "Offshore Engineering Director", ["Protective", "Formal", "Under Pressure"], "An external agency delivered substandard code weeks late while demanding full milestone signoff. Negotiate remediation firmly.", "ffdfbf"),
        ("Design System Override Dispute", "Sienna", "Lead UI Architect", ["Passionate", "Frustrated", "Talented"], "Engineers bypassed design tokens during a sprint to hit deadlines. De-escalate her frustration and rebuild a collaborative protocol.", "d1d4f9"),
        ("Open-Source Repository Gatekeeping", "Felix", "Principal Maintainer", ["Blunt", "Territorial", "Skeptical"], "A maintainer arbitrarily blocked your pull request with dismissive comments. Address the critique constructively to reach an unblock.", "ffd5dc")
    ],
    "active-listening": [
        ("Enterprise Churn Crisis", "Tariq", "VP of Customer Operations", ["Enraged", "Overwhelmed", "Vulnerable"], "A major enterprise client experienced data migration failures right before their board meeting. Listen deeply and validate their crisis.", "ffd5dc"),
        ("Silent Burnout 1-on-1", "Chloe", "Staff Software Engineer", ["Quiet", "Exhausted", "Reluctant"], "A top-performing remote teammate is falling behind and closing off. Draw them out with patience, empathy, and non-judgmental presence.", "b6e3f4"),
        ("Nuanced User Discovery Interview", "Niko", "Hospital Operations Lead", ["Guarded", "Busy", "Subtle"], "An enterprise healthcare administrator says the software is 'fine' but repeatedly sighs. Uncover unstated friction points through active listening.", "c0aede"),
        ("Cross-Cultural Remote Friction", "Yuki", "Lead Data Scientist in Tokyo", ["Polite", "Reserved", "Misunderstood"], "Unpack unspoken passive-aggressive tension stemming from cultural communication differences between global remote offices.", "d1d4f9"),
        ("Post-Failure Blameless Counseling", "Devon", "Junior Backend Developer", ["Shaken", "Self-Blaming", "Anxious"], "A junior engineer's config change took down user authentication. Help them process the setback and rebuild technical confidence.", "ffdfbf"),
        ("Departing Veteran Exit Interview", "Simone", "Principal Product Designer", ["Candid", "Disillusioned", "Insightful"], "A departing senior staff member shares blunt, emotionally charged observations about company culture. Listen without defensiveness.", "b6e3f4")
    ],
    "communication": [
        ("Hospital Cyber Incident Briefing", "Sterling", "Chief Information Security Officer", ["Alarmed", "Urgent", "Strategic"], "Explain a medical database ransomware containment plan to executive board members without causing panic or using technical jargon.", "b6e3f4"),
        ("Smart-Transit Council Hearing", "Evelyn", "Municipal Transit Chair", ["Pragmatic", "Skeptical", "Public-Minded"], "Pitch an autonomous electric shuttle pilot to a skeptical municipal council, directly addressing safety and community equity concerns.", "ffdfbf"),
        ("Explaining AI Hallucinations to Surgeons", "Dr. Rajiv", "Chief of Surgery", ["Demanding", "High-Precision", "Time-Pressed"], "Explain machine learning probabilistic boundaries and diagnostic tool limitations in plain, authoritative clinical terms.", "c0aede"),
        ("Orbital Telemetry Night Handover", "Farah", "Satellite Flight Controller", ["Vigilant", "Tired", "Meticulous"], "Deliver an urgent, concise briefing on irregular satellite thermal telemetry before handing over mission control to the night shift.", "d1d4f9"),
        ("Franchise Rebrand Town Hall", "Dominic", "Senior Franchise Representative", ["Traditional", "Skeptical", "Protective"], "Explain the economic necessity of a bold digital brand overhaul to franchise owners who fear alienating legacy customers.", "ffd5dc"),
        ("Downturn Runway Strategy Update", "Valerie", "Lead Angel Investor", ["Sharp", "Results-Oriented", "Direct"], "Communicate prudent runway preservation decisions and altered hiring goals with clarity, transparency, and confidence.", "b6e3f4")
    ]
}

def fallback_generate_scenarios(skill_id: str, skill_name: str, past_stats: Dict[str, Any]) -> List[Dict[str, Any]]:
    ts = int(random.random() * 10000)
    pool = DIVERSE_SCENARIO_POOLS.get(skill_id, DIVERSE_SCENARIO_POOLS["communication"])
    
    # Pick 3 distinct random scenarios from the rich pool
    sampled = random.sample(pool, min(3, len(pool)))
    results = []

    for i, (title, char_name, char_role, tags, desc, bg) in enumerate(sampled):
        sc_id = f"gen-{skill_id}-{ts}-{i+1}"
        results.append({
            "id": sc_id,
            "skill_id": skill_id,
            "title": title,
            "description": desc,
            "character_name": char_name,
            "character_role": char_role,
            "character_status": "Online",
            "character_tags": tags,
            "avatar_url": f"https://api.dicebear.com/7.x/notionists/svg?seed={char_name}&backgroundColor={bg}"
        })

    return results


def generate_character_opening_openrouter(scenario: Dict[str, Any], difficulty: str) -> Optional[str]:
    """
    Generates a natural, realistic 1-sentence opening greeting in-character based on the specific scenario.
    """
    if not settings.OPENROUTER_API_KEY:
        return None

    char_name = scenario.get("character_name", "Alex")
    char_role = scenario.get("character_role", "Colleague")
    title = scenario.get("title", "Roleplay")
    desc = scenario.get("description", "")

    prompt = f"""You are roleplaying as {char_name}, working as a {char_role}.
Scenario Title: {title}
Context: {desc}
Difficulty: {difficulty}

Generate your opening 1-2 sentence dialogue line to begin this roleplay. 
Speak strictly in-character, establishing the scene naturally.
Do NOT say 'Hi there, how's everything going with you today?'. Speak directly about the immediate situation.
Return ONLY the raw dialogue line:"""

    headers = {
        "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "SocialSim AI Simulator"
    }
    payload = {
        "model": settings.OPENROUTER_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 70,
        "temperature": 0.8
    }

    try:
        res = requests.post(OPENROUTER_URL, headers=headers, json=payload, timeout=8)
        if res.status_code == 200:
            text = res.json()["choices"][0]["message"]["content"].strip()
            if text.startswith('"') and text.endswith('"'):
                text = text[1:-1].strip()
            if len(text) > 10:
                return text
    except Exception as e:
        print(f"Error generating character opening: {e}")

    return None


