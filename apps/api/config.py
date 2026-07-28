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

# — Email (Brevo SMTP) ————————————————————————————————————————————————
_legacy_resend_key = os.getenv("RESEND_API_KEY", "")
_legacy_resend_from = os.getenv("RESEND_FROM", "")

BREVO_SMTP_HOST = os.getenv("BREVO_SMTP_HOST", "smtp-relay.brevo.com")
BREVO_SMTP_PORT = int(os.getenv("BREVO_SMTP_PORT", "587"))
BREVO_SMTP_LOGIN = os.getenv("BREVO_SMTP_LOGIN", "")
BREVO_SMTP_KEY = os.getenv("BREVO_SMTP_KEY", "")
BREVO_FROM = os.getenv("BREVO_FROM", "") or _legacy_resend_from
BREVO_FROM_NAME = os.getenv("BREVO_FROM_NAME", "HireLoop")

APP_URL = os.getenv("APP_URL") or os.getenv("NEXT_PUBLIC_APP_URL", "http://localhost:3000")
SENTRY_DSN = os.getenv("SENTRY_DSN", "")

# — Dev SQLite fallback ————————————————————————————————————————————————
DEV_SQLITE = os.getenv("DEV_SQLITE", "").strip() in ("1", "true", "yes")
DEV_SQLITE_PATH = os.getenv("DEV_SQLITE_PATH", str(Path(__file__).parent / "dev.sqlite"))
_dev_sqlite_local = threading.local()

# — Redis / WebSocket limits ————————————————————————————————————————————
REDIS_URL = os.getenv("REDIS_URL", "")
MAX_WS_PER_IP = int(os.getenv("MAX_WS_PER_IP", "3"))
WS_CONNECTION_TTL = int(os.getenv("WS_CONNECTION_TTL", "3600"))  # seconds to keep per-IP counter
WS_MAX_BINARY_BYTES = int(os.getenv("MAX_WS_MESSAGE_BYTES", str(10 * 1024 * 1024)))  # 10MB default
WS_MAX_TEXT_CHARS = int(os.getenv("MAX_WS_TEXT_CHARS", "20000"))

# — Supabase service-role key presence (informational) ————————————————————
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
SERVICE_ROLE_CONFIGURED = bool(SUPABASE_SERVICE_ROLE_KEY)


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
    return bool(BREVO_SMTP_KEY and BREVO_FROM)


def supabase_enabled() -> bool:
    """True when either Supabase or dev SQLite is configured."""
    if DEV_SQLITE:
        return True
    return bool(SUPABASE_URL and SUPABASE_SECRET_KEY)
