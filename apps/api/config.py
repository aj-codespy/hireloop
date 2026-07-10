import os

from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
MODEL = os.getenv("MODEL", "gemini-3.1-flash-live-preview")
SCORING_MODEL = os.getenv("SCORING_MODEL", "gemini-2.5-flash")
STT_MODEL = os.getenv("STT_MODEL", "gemini-2.5-flash")
TTS_MODEL = os.getenv("TTS_MODEL", "gemini-2.5-flash-preview-tts")
TTS_VOICE_EN = os.getenv("TTS_VOICE_EN", "Kore")
TTS_VOICE_HI = os.getenv("TTS_VOICE_HI", "Kore")
DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY", "")
PORT = int(os.getenv("PORT", "8000"))
INTERVIEW_OVERALL_LIMIT_SECONDS = int(os.getenv("INTERVIEW_OVERALL_LIMIT_SECONDS", "600"))
INTERVIEW_RECONNECT_HOURS = int(os.getenv("INTERVIEW_RECONNECT_HOURS", "2"))

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_SECRET_KEY = os.getenv("SUPABASE_SECRET_KEY") or os.getenv(
    "SUPABASE_SERVICE_ROLE_KEY", ""
)

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
RESEND_FROM = os.getenv("RESEND_FROM", "")
APP_URL = os.getenv("APP_URL") or os.getenv("NEXT_PUBLIC_APP_URL", "http://localhost:3000")


def email_configured() -> bool:
    return bool(RESEND_API_KEY and RESEND_FROM)


def supabase_enabled() -> bool:
    return bool(SUPABASE_URL and SUPABASE_SECRET_KEY)
