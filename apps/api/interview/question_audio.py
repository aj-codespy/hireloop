"""Pre-render interview question TTS and store in Supabase Storage."""

from __future__ import annotations

import logging

import httpx

from config import SUPABASE_SECRET_KEY, SUPABASE_URL
from interview.tts import synthesize_question
from utils.http_pool import get_http_client

logger = logging.getLogger(__name__)

QUESTION_AUDIO_BUCKET = "question-audio"


def _public_url(object_path: str) -> str:
    base = SUPABASE_URL.rstrip("/")
    return f"{base}/storage/v1/object/public/{QUESTION_AUDIO_BUCKET}/{object_path}"


async def upload_question_audio(question_id: str, audio_bytes: bytes, *, mime_type: str, lang: str) -> str | None:
    if not audio_bytes or not SUPABASE_URL or not SUPABASE_SECRET_KEY:
        return None

    ext = "wav" if "wav" in mime_type else "webm"
    object_path = f"{question_id}/{lang}.{ext}"
    upload_url = f"{SUPABASE_URL.rstrip('/')}/storage/v1/object/{QUESTION_AUDIO_BUCKET}/{object_path}"
    headers = {
        "apikey": SUPABASE_SECRET_KEY,
        "Authorization": f"Bearer {SUPABASE_SECRET_KEY}",
        "Content-Type": mime_type,
        "x-upsert": "true",
    }
    client = get_http_client()
    res = await client.post(upload_url, headers=headers, content=audio_bytes, timeout=60.0)
    if res.status_code >= 400:
        logger.warning("Question audio upload failed: %s %s", res.status_code, res.text)
        return None
    return _public_url(object_path)


async def render_question_audio(question_id: str, prompt: str, *, lang: str = "en") -> str | None:
    """Synthesize TTS once and upload. Returns public URL or None."""
    audio_bytes, mime_type = synthesize_question(prompt, language=lang)
    if not audio_bytes:
        return None
    return await upload_question_audio(question_id, audio_bytes, mime_type=mime_type, lang=lang)


async def render_questions_for_job(store, question_ids: list[str], *, langs: tuple[str, ...] = ("en", "hi")) -> dict[str, dict[str, str]]:
    """Render TTS for a list of question IDs. Returns {question_id: {en: url, hi: url}}."""
    results: dict[str, dict[str, str]] = {}
    if not question_ids:
        return results

    rows = await store._request(
        "GET",
        "questions",
        params={
            "id": f"in.({','.join(question_ids)})",
            "select": "id,prompt_text,audio_url,audio_url_hi",
        },
    )
    for row in rows or []:
        qid = row["id"]
        prompt = row.get("prompt_text") or ""
        if not prompt.strip():
            continue
        urls: dict[str, str] = {}
        patch: dict[str, str] = {}
        for lang in langs:
            col = "audio_url" if lang == "en" else "audio_url_hi"
            existing = row.get(col)
            if existing:
                urls[lang] = existing
                continue
            url = await render_question_audio(qid, prompt, lang=lang)
            if url:
                urls[lang] = url
                patch[col] = url
        if patch:
            await store._request(
                "PATCH",
                "questions",
                params={"id": f"eq.{qid}"},
                json=patch,
                prefer="return=minimal",
            )
        if urls:
            results[qid] = urls
    return results
