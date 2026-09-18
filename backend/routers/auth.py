import time
import uuid
from fastapi import APIRouter, HTTPException, status, Depends
from models import RegisterRequest, RegisterResponse, LoginRequest, LoginResponse, UserResponse
from database import get_db_connection
from auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register_user(req: RegisterRequest):
    """
    Creates a new user account.
    """
    email_clean = req.email.strip().lower()
    name_clean = req.name.strip()
    
    if not email_clean or not name_clean or not req.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Name, email, and password are required."
        )
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if user already exists
    cursor.execute("SELECT id FROM users WHERE email = ?", (email_clean,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )
    
    user_id = f"usr_{int(time.time() * 1000)}"
    hashed_pwd = hash_password(req.password)
    
    cursor.execute(
        "INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)",
        (user_id, name_clean, email_clean, hashed_pwd)
    )
    conn.commit()
    conn.close()
    
    return RegisterResponse(
        user_id=user_id,
        name=name_clean,
        email=email_clean
    )

@router.post("/login", response_model=LoginResponse)
def login_user(req: LoginRequest):
    """
    Logs the user in and returns a JWT access token.
    """
    email_clean = req.email.strip().lower()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, email, password_hash FROM users WHERE email = ?", (email_clean,))
    user = cursor.fetchone()
    conn.close()
    
    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Generate JWT token with sub and user details
    token_payload = {
        "sub": user["id"],
        "name": user["name"],
        "email": user["email"]
    }
    access_token = create_access_token(token_payload)
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer"
    )

@router.get("/me", response_model=UserResponse)
def get_me(current_user: UserResponse = Depends(get_current_user)):
    """
    Gets the currently logged-in user profile.
    Requires Bearer token authentication.
    """
    return current_user
