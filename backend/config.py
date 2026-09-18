import os

class Settings:
    PROJECT_NAME: str = "SocialSim API"
    PROJECT_VERSION: str = "1.0.0"
    
    # JWT Settings
    SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "socialsim-super-secret-jwt-key-2026-secure-development")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # CORS Settings
    CORS_ORIGINS: list = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*"
    ]

settings = Settings()
