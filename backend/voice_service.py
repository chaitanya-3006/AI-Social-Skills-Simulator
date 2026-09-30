import hashlib
import requests
from typing import Optional, Dict
from config import settings

ELEVENLABS_TTS_URL = "https://api.elevenlabs.io/v1/text-to-speech"

# Mapping of character personas to verified working ElevenLabs voice IDs
CHARACTER_VOICES: Dict[str, str] = {
    "alex": "ErXwobaYiN019PkySvjV",    # Antoni (Male, dynamic & conversational)
    "sarah": "EXAVITQu4vr4xnSDxMaL",   # Bella (Female, professional & clear)
    "jordan": "pNInz6obpgDQGcFmaJgB",  # Adam (Male, deep & expressive)
    "elena": "EXAVITQu4vr4xnSDxMaL",   # Bella (Female, warm & empathetic)
    "marcus": "JBFqnCBsd6RMkjVDRZzb",  # George (Male, authoritative & calm)
    "default": "ErXwobaYiN019PkySvjV"
}

# In-memory audio cache to minimize ElevenLabs API usage
_audio_cache: Dict[str, bytes] = {}

def get_voice_id_for_character(character_name: str) -> str:
    name_clean = character_name.strip().lower()
    for key, voice_id in CHARACTER_VOICES.items():
        if key in name_clean:
            return voice_id
    return CHARACTER_VOICES["default"]

def synthesize_character_voice(text: str, character_name: str = "default") -> Optional[bytes]:
    """
    Synthesizes speech for an AI character using ElevenLabs API.
    Returns MP3 audio bytes or None on error.
    """
    if not text or not text.strip():
        return None
        
    voice_id = get_voice_id_for_character(character_name)
    clean_text = text.strip()
    
    # Check cache
    cache_key = hashlib.md5(f"{voice_id}:{clean_text}".encode("utf-8")).hexdigest()
    if cache_key in _audio_cache:
        return _audio_cache[cache_key]

    if not settings.ELEVENLABS_API_KEY:
        print("ElevenLabs API key not configured.")
        return None

    url = f"{ELEVENLABS_TTS_URL}/{voice_id}"
    headers = {
        "xi-api-key": settings.ELEVENLABS_API_KEY,
        "Content-Type": "application/json"
    }
    payload = {
        "text": clean_text,
        "model_id": settings.ELEVENLABS_MODEL,
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75
        }
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        if response.status_code == 200 and len(response.content) > 0:
            audio_bytes = response.content
            # Cache up to 100 clips
            if len(_audio_cache) > 100:
                _audio_cache.clear()
            _audio_cache[cache_key] = audio_bytes
            return audio_bytes
        else:
            print(f"ElevenLabs TTS failed: {response.status_code} - {response.text[:150]}")
    except Exception as e:
        print(f"ElevenLabs TTS exception: {e}")

    return None
