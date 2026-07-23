import os
import sqlite3
import threading
from pathlib import Path

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

# — Email (Brevo / SendinBlue) ———————————————————————————————————————————
_legacy_resend_key = os.getenv("RESEND_API_KEY", "")
_legacy_resend_from = os.getenv("RESEND_FROM", "")

BREVO_API_KEY = os.getenv("BREVO_API_KEY", "") or _legacy_resend_key
BREVO_FROM = os.getenv("BREVO_FROM", "") or _legacy_resend_from
BREVO_FROM_NAME = os.getenv("BREVO_FROM_NAME", "HireLoop")

APP_URL = os.getenv("APP_URL") or os.getenv("NEXT_PUBLIC_APP_URL", "http://localhost:3000")

# — Dev SQLite fallback ————————————————————————————————————————————————
DEV_SQLITE = os.getenv("DEV_SQLITE", "").strip() in ("1", "true", "yes")
DEV_SQLITE_PATH = os.getenv("DEV_SQLITE_PATH", str(Path(__file__).parent / "dev.sqlite"))
_dev_sqlite_local = threading.local()


def dev_sqlite_connection() -> sqlite3.Connection:
    """Return a per-thread SQLite connection for dev mode.

    When ``DEV_SQLITE=1`` is exported, ``supabase_enabled()`` returns true,
    but ``get_store()`` hands back a lightweight SQLite-backed store so
    developers can run the API without provisioning a Supabase project.
    """
    conn = getattr(_dev_sqlite_local, "conn", None)
    if conn is None:
        conn = sqlite3.connect(DEV_SQLITE_PATH, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA foreign_keys=ON")
        _dev_sqlite_local.conn = conn
    return conn


def email_configured() -> bool:
    return bool(BREVO_API_KEY and BREVO_FROM)


def supabase_enabled() -> bool:
    """True when either Supabase or dev SQLite is configured."""
    if DEV_SQLITE:
        return True
    return bool(SUPABASE_URL and SUPABASE_SECRET_KEY)
