"""Text-to-speech for interview questions (English + Hindi)."""

from __future__ import annotations

import base64
import io
import logging
import wave

from google import genai
from google.genai import types

from config import GEMINI_API_KEY, TTS_MODEL, TTS_VOICE_EN, TTS_VOICE_HI

logger = logging.getLogger(__name__)


def synthesize_question(text: str, *, language: str = "en") -> tuple[bytes, str]:
    """Return (audio_bytes, mime_type). Falls back to empty bytes on failure."""
    if not text.strip() or not GEMINI_API_KEY:
        return b"", "audio/wav"

    voice = TTS_VOICE_HI if language == "hi" else TTS_VOICE_EN
    lang_label = "Hindi" if language == "hi" else "English"

    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
        response = client.models.generate_content(
            model=TTS_MODEL,
            contents=f"Read the following interview question aloud naturally in {lang_label}:\n\n{text}",
            config=types.GenerateContentConfig(
                response_modalities=["AUDIO"],
                speech_config=types.SpeechConfig(
                    voice_config=types.VoiceConfig(
                        prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=voice)
                    )
                ),
            ),
        )
        for part in response.candidates[0].content.parts:
            inline = getattr(part, "inline_data", None)
            if inline and inline.data:
                data = inline.data
                audio_bytes = base64.b64decode(data) if isinstance(data, str) else bytes(data)
                mime = inline.mime_type or "audio/wav"
                
                if "audio/L16" in mime:
                    rate = 24000
                    if "rate=" in mime:
                        try:
                            rate = int(mime.split("rate=")[1].split(";")[0])
                        except Exception:
                            pass
                    buf = io.BytesIO()
                    with wave.open(buf, "wb") as wf:
                        wf.setnchannels(1)
                        wf.setsampwidth(2)
                        wf.setframerate(rate)
                        wf.writeframes(audio_bytes)
                    audio_bytes = buf.getvalue()
                    mime = "audio/wav"
                    
                return audio_bytes, mime
    except Exception as exc:
        logger.warning("TTS generation failed: %s", exc)

    return b"", "audio/wav"


def audio_to_base64(audio_bytes: bytes) -> str:
    return base64.b64encode(audio_bytes).decode("ascii") if audio_bytes else ""
