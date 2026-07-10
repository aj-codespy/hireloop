"""Speech-to-text for per-question answer clips."""

from __future__ import annotations

import base64
import logging

import httpx
from google import genai
from google.genai import types

from config import DEEPGRAM_API_KEY, GEMINI_API_KEY, STT_MODEL

logger = logging.getLogger(__name__)

LANGUAGE_CODES = {
    "en": "en",
    "hi": "hi",
}


def transcribe_audio(audio_bytes: bytes, *, mime_type: str = "audio/webm", language: str = "en") -> str:
    """Return transcript text. Empty string if audio is empty or STT fails silently."""
    if not audio_bytes:
        return ""

    lang = LANGUAGE_CODES.get(language, "en")

    if DEEPGRAM_API_KEY:
        try:
            return _transcribe_deepgram(audio_bytes, mime_type=mime_type, language=lang)
        except Exception as exc:
            logger.warning("Deepgram STT failed, falling back to Gemini: %s", exc)

    return _transcribe_gemini(audio_bytes, mime_type=mime_type, language=lang)


def _transcribe_deepgram(audio_bytes: bytes, *, mime_type: str, language: str) -> str:
    url = "https://api.deepgram.com/v1/listen"
    params = {"model": "nova-2", "language": language, "smart_format": "true"}
    headers = {
        "Authorization": f"Token {DEEPGRAM_API_KEY}",
        "Content-Type": mime_type,
    }
    with httpx.Client(timeout=60.0) as client:
        res = client.post(url, params=params, headers=headers, content=audio_bytes)
        res.raise_for_status()
        data = res.json()
    return (data.get("results", {}).get("channels", [{}])[0].get("alternatives", [{}])[0].get("transcript") or "").strip()


def _transcribe_gemini(audio_bytes: bytes, *, mime_type: str, language: str) -> str:
    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY is not set")

    lang_name = "Hindi" if language == "hi" else "English"
    client = genai.Client(api_key=GEMINI_API_KEY)
    response = client.models.generate_content(
        model=STT_MODEL,
        contents=[
            types.Content(
                role="user",
                parts=[
                    types.Part.from_bytes(data=audio_bytes, mime_type=mime_type),
                    types.Part(
                        text=(
                            f"Transcribe this interview answer accurately in {lang_name}. "
                            "Return only the spoken words with no commentary."
                        )
                    ),
                ],
            )
        ],
    )
    return (response.text or "").strip()


def decode_audio_payload(payload: dict) -> tuple[bytes, str]:
    raw = payload.get("audio_base64") or ""
    if not raw:
        return b"", payload.get("mime_type") or "audio/webm"
    return base64.b64decode(raw), payload.get("mime_type") or "audio/webm"
