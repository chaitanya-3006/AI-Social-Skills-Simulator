import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from main import app
from database import init_db

init_db()
client = TestClient(app)

def run_tests():
    print("Testing FastAPI endpoints...")
    
    # 1. Health check
    res = client.get("/")
    assert res.status_code == 200, f"Root failed: {res.text}"
    print("[PASS] GET /: Root health endpoint works")

    # 2. Register
    import time
    test_email = f"test_{int(time.time() * 1000)}@example.com"
    reg_data = {
        "name": "Chaitanya Test",
        "email": test_email,
        "password": "securepassword123"
    }
    res = client.post("/api/auth/register", json=reg_data)
    assert res.status_code == 201, f"Register failed: {res.text}"
    user_info = res.json()
    assert "user_id" in user_info and user_info["name"] == "Chaitanya Test"
    assert user_info["email"] == test_email
    print(f"[PASS] POST /api/auth/register: User created ({user_info['user_id']})")

    # 3. Login
    login_data = {
        "email": test_email,
        "password": "securepassword123"
    }
    res = client.post("/api/auth/login", json=login_data)
    assert res.status_code == 200, f"Login failed: {res.text}"
    token_info = res.json()
    assert "access_token" in token_info and token_info["token_type"] == "bearer"
    token = token_info["access_token"]
    print("[PASS] POST /api/auth/login: JWT token successfully generated")

    # 4. GET /api/auth/me
    headers = {"Authorization": f"Bearer {token}"}
    res = client.get("/api/auth/me", headers=headers)
    assert res.status_code == 200, f"Get me failed: {res.text}"
    me = res.json()
    assert me["email"] == test_email and me["name"] == "Chaitanya Test"
    print(f"[PASS] GET /api/auth/me: Retrieved user profile ({me['name']} - {me['email']})")

    # 5. GET /api/skills
    res = client.get("/api/skills")
    assert res.status_code == 200, f"Get skills failed: {res.text}"
    skills = res.json()
    assert len(skills) >= 5
    print(f"[PASS] GET /api/skills: Retrieved {len(skills)} skills successfully")

    # 6. GET /api/skills/communication
    res = client.get("/api/skills/communication")
    assert res.status_code == 200, f"Get skill failed: {res.text}"
    skill = res.json()
    assert skill["id"] == "communication" and skill["name"] == "Communication"
    print(f"[PASS] GET /api/skills/communication: Retrieved skill '{skill['name']}'")

    # 7. GET /api/skills/invalid-skill
    res = client.get("/api/skills/invalid-skill-xyz")
    assert res.status_code == 404
    print("[PASS] GET /api/skills/invalid-skill: Correctly returned 404 Not Found")

    print("\nALL FASTAPI BACKEND ENDPOINTS TESTED AND WORKING PERFECTLY!")

if __name__ == "__main__":
    run_tests()
