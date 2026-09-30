from fastapi import APIRouter, HTTPException, Query, Response, status
from pydantic import BaseModel
from voice_service import synthesize_character_voice

router = APIRouter(prefix="/api/voice", tags=["Voice & TTS"])

class TTSRequest(BaseModel):
    text: str
    character: str = "Alex"

@router.get("/tts")
def get_tts_audio(
    text: str = Query(..., description="Text content to speak"),
    character: str = Query("Alex", description="AI character persona name")
):
    """
    Generates ElevenLabs audio for the specified AI character dialogue and streams MP3 back.
    """
    if not text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    audio_bytes = synthesize_character_voice(text, character)
    if not audio_bytes:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate ElevenLabs voice audio."
        )

    return Response(
        content=audio_bytes,
        media_type="audio/mpeg",
        headers={
            "Content-Disposition": f'inline; filename="voice_{character.lower()}.mp3"',
            "Cache-Control": "public, max-age=86400"
        }
    )

@router.post("/tts")
def post_tts_audio(req: TTSRequest):
    """
    Accepts JSON body and returns ElevenLabs audio stream.
    """
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    audio_bytes = synthesize_character_voice(req.text, req.character)
    if not audio_bytes:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate ElevenLabs voice audio."
        )

    return Response(
        content=audio_bytes,
        media_type="audio/mpeg",
        headers={
            "Content-Disposition": f'inline; filename="voice_{req.character.lower()}.mp3"',
            "Cache-Control": "public, max-age=86400"
        }
    )
