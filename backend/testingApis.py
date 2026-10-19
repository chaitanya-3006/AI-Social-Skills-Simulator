import os
import requests
from dotenv import load_dotenv

load_dotenv()

# ==============================
# ElevenLabs Settings
# ==============================

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
ELEVENLABS_MODEL = os.getenv(
    "ELEVENLABS_MODEL",
    "eleven_turbo_v2_5"
)

# Replace this with a voice ID from your ElevenLabs account
VOICE_ID = "YOUR_VOICE_ID"


# ==============================
# Test ElevenLabs TTS
# ==============================

def test_elevenlabs():
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}"

    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
    }

    data = {
        "text": "Hello! This is a test of the ElevenLabs text to speech API.",
        "model_id": ELEVENLABS_MODEL,
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75,
        },
    }

    response = requests.post(
        url,
        headers=headers,
        json=data
    )

    print("ElevenLabs Status:", response.status_code)

    if response.status_code == 200:
        with open("elevenlabs_test.mp3", "wb") as f:
            f.write(response.content)

        print("✅ ElevenLabs test successful!")
        print("🎵 Audio saved as: elevenlabs_test.mp3")

    else:
        print("❌ ElevenLabs test failed!")
        print(response.text)


if __name__ == "__main__":
    test_elevenlabs()