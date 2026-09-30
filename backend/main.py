import os
import sys

# Ensure backend directory is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from database import init_db
from routers.auth import router as auth_router
from routers.skills import router as skills_router
from routers.scenarios import router as scenarios_router
from routers.simulation import router as simulation_router
from routers.history import router as history_router
from routers.progress import router as progress_router
from routers.voice import router as voice_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="SocialSim API — Full Backend for AI Social Skills Simulator with OpenRouter LLM & ElevenLabs Voice"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event
@app.on_event("startup")
def on_startup():
    init_db()

# Include Routers
app.include_router(auth_router)
app.include_router(skills_router)
app.include_router(scenarios_router)
app.include_router(simulation_router)
app.include_router(history_router)
app.include_router(progress_router)
app.include_router(voice_router)

@app.get("/")
def root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION,
        "docs_url": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
