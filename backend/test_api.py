import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from main import app
from database import init_db

init_db()
client = TestClient(app)

def run_tests():
    print("Testing SocialSim FastAPI Endpoints with OpenRouter & ElevenLabs...")
    
    # 1. Health check
    res = client.get("/")
    assert res.status_code == 200, f"Root failed: {res.text}"
    print("[PASS] 1. GET /: Root health endpoint works")

    # 2. Register
    import time
    test_email = f"test_{int(time.time() * 1000)}@example.com"
    reg_data = {
        "name": "Chaitanya Voice Tester",
        "email": test_email,
        "password": "securepassword123"
    }
    res = client.post("/api/auth/register", json=reg_data)
    assert res.status_code == 201, f"Register failed: {res.text}"
    user_info = res.json()
    assert "user_id" in user_info and user_info["name"] == "Chaitanya Voice Tester"
    print(f"[PASS] 2. POST /api/auth/register: User created ({user_info['user_id']})")

    # 3. Login
    login_data = {
        "email": test_email,
        "password": "securepassword123"
    }
    res = client.post("/api/auth/login", json=login_data)
    assert res.status_code == 200, f"Login failed: {res.text}"
    token_info = res.json()
    token = token_info["access_token"]
    auth_headers = {"Authorization": f"Bearer {token}"}
    print("[PASS] 3. POST /api/auth/login: JWT token generated")

    # 4. GET /api/auth/me
    res = client.get("/api/auth/me", headers=auth_headers)
    assert res.status_code == 200
    me = res.json()
    assert me["email"] == test_email
    print(f"[PASS] 4. GET /api/auth/me: Retrieved profile ({me['name']})")

    # 5. GET /api/skills
    res = client.get("/api/skills")
    assert res.status_code == 200
    skills = res.json()
    assert len(skills) >= 5
    print(f"[PASS] 5. GET /api/skills: Found {len(skills)} skills")

    # 6. GET /api/scenarios
    res = client.get("/api/scenarios")
    assert res.status_code == 200
    scenarios = res.json()
    assert len(scenarios) >= 3
    print(f"[PASS] 6. GET /api/scenarios: Found {len(scenarios)} scenarios")

    # 7. POST /api/simulation/start
    sim_start_data = {
        "scenario_id": "networking-event",
        "difficulty": "medium"
    }
    res = client.post("/api/simulation/start", json=sim_start_data, headers=auth_headers)
    assert res.status_code == 200
    sim_start = res.json()
    session_id = sim_start["session_id"]
    print(f"[PASS] 7. POST /api/simulation/start: Session created ({session_id})")

    # 8. POST /api/chat (OpenRouter LLM Roleplay)
    chat_data = {
        "session_id": session_id,
        "message": "Hi Alex! I build AI web applications and love meeting other developers here."
    }
    print("Sending message to OpenRouter AI character...")
    res = client.post("/api/chat", json=chat_data, headers=auth_headers)
    assert res.status_code == 200
    ai_msg = res.json()
    assert ai_msg["role"] == "ai" and len(ai_msg["content"]) > 5
    print(f"[PASS] 8. POST /api/chat (OpenRouter LLM): AI replied -> \"{ai_msg['content']}\"")

    # 9. GET /api/voice/tts (ElevenLabs Character Voice TTS)
    print("Testing ElevenLabs TTS voice synthesis...")
    res = client.get(f"/api/voice/tts?text={ai_msg['content'][:60]}&character=Alex")
    assert res.status_code == 200
    assert len(res.content) > 1000
    assert res.headers["content-type"] == "audio/mpeg"
    print(f"[PASS] 9. GET /api/voice/tts (ElevenLabs): Generated {len(res.content)} bytes of character audio MP3!")

    # 10. POST /api/simulation/end (OpenRouter Qualitative AI Evaluation)
    print("Finalizing session & requesting OpenRouter coaching evaluation...")
    res = client.post("/api/simulation/end", json={"session_id": session_id}, headers=auth_headers)
    assert res.status_code == 200
    print("[PASS] 10. POST /api/simulation/end: Evaluation computed")

    # 11. GET /api/evaluation/{session_id}
    res = client.get(f"/api/evaluation/{session_id}")
    assert res.status_code == 200
    eval_report = res.json()
    assert "overall_score" in eval_report and eval_report["overall_score"] > 0
    assert len(eval_report["skills"]) >= 3
    assert len(eval_report["what_you_did_well"]) >= 1
    assert len(eval_report["better_responses"]) == 3
    print(f"[PASS] 11. GET /api/evaluation (OpenRouter Coach): Overall score {eval_report['overall_score']}/10")
    print(f"      Strength: \"{eval_report['what_you_did_well'][0]}\"")
    print(f"      Better response (Confident): \"{eval_report['better_responses'][1]['text']}\"")

    # 12. GET /api/history & /api/progress
    res = client.get("/api/history", headers=auth_headers)
    assert res.status_code == 200
    assert len(res.json()) >= 1
    print(f"[PASS] 12. GET /api/history: Found {len(res.json())} sessions")

    res = client.get("/api/progress", headers=auth_headers)
    assert res.status_code == 200
    prog = res.json()
    print(f"[PASS] 13. GET /api/progress: Total sessions: {prog['total_sessions']}, Average: {prog['average_score']}")

    print("\n==================================================================")
    print("ALL 13 TESTS (OPENROUTER LLM & ELEVENLABS TTS) PASSED PERFECTLY!")
    print("==================================================================")

if __name__ == "__main__":
    run_tests()
