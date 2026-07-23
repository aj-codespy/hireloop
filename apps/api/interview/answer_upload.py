"""Chunked answer audio upload and assembly (Phase 2)."""

from __future__ import annotations

import asyncio
import logging
from typing import Any

import httpx

from config import SUPABASE_SECRET_KEY, SUPABASE_URL
from utils.http_pool import get_http_client

logger = logging.getLogger(__name__)

ANSWERS_BUCKET = "interview-answers"


def chunk_object_path(session_id: str, question_index: int, chunk_index: int) -> str:
    return f"{session_id}/{question_index}/{chunk_index:04d}.webm"


async def upload_answer_chunk(
    session_id: str,
    question_index: int,
    chunk_index: int,
    data: bytes,
    *,
    mime_type: str = "audio/webm",
) -> str:
    object_path = chunk_object_path(session_id, question_index, chunk_index)
    upload_url = f"{SUPABASE_URL.rstrip('/')}/storage/v1/object/{ANSWERS_BUCKET}/{object_path}"
    headers = {
        "apikey": SUPABASE_SECRET_KEY,
        "Authorization": f"Bearer {SUPABASE_SECRET_KEY}",
        "Content-Type": mime_type,
        "x-upsert": "true",
    }
    client = get_http_client()
    res = await client.post(upload_url, headers=headers, content=data, timeout=60.0)
    if res.status_code >= 400:
        raise RuntimeError(f"Chunk upload failed: {res.status_code} {res.text}")
    return object_path


async def download_object(object_path: str) -> bytes:
    url = f"{SUPABASE_URL.rstrip('/')}/storage/v1/object/{ANSWERS_BUCKET}/{object_path}"
    headers = {
        "apikey": SUPABASE_SECRET_KEY,
        "Authorization": f"Bearer {SUPABASE_SECRET_KEY}",
    }
    client = get_http_client()
    res = await client.get(url, headers=headers, timeout=60.0)
    if res.status_code >= 400:
        raise RuntimeError(f"Download failed: {res.status_code}")
    return res.content


async def assemble_answer_audio(session_id: str, question_index: int, chunk_count: int) -> tuple[bytes, str]:
    """Concatenate uploaded chunks in order. WebM chunks from the same recorder session
    concatenate cleanly as a single blob."""
    async def _download(i: int) -> bytes:
        path = chunk_object_path(session_id, question_index, i)
        return await download_object(path)
        
    parts = await asyncio.gather(*[_download(i) for i in range(chunk_count)])
    return b"".join(parts), "audio/webm"


def update_chunks_meta(existing: dict[str, Any], question_index: int, *, chunk_index: int | None = None, chunk_count: int | None = None, finalized: bool = False) -> dict[str, Any]:
    key = str(question_index)
    entry = dict(existing.get(key) or {})
    paths: list[str] = list(entry.get("chunk_paths") or [])
    if chunk_index is not None:

        # store relative path without session prefix duplication
        rel = f"{question_index}/{chunk_index:04d}.webm"
        if rel not in paths:
            paths.append(rel)
        entry["chunk_paths"] = sorted(set(paths))
    if chunk_count is not None:
        entry["chunk_count"] = chunk_count
    entry["mime_type"] = "audio/webm"
    if finalized:
        entry["finalized"] = True
    existing[key] = entry
    return existing
