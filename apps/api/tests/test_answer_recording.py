"""Regression: failed chunk assemble must not score as an empty answered question."""

from __future__ import annotations

import base64
from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest

from interview.session import InterviewSession, SessionStatus
from interview.structured_relay import StructuredInterviewRelay


class _FakeWS:
    def __init__(self) -> None:
        self.sent: list[dict] = []

    async def send_json(self, payload: dict) -> None:
        self.sent.append(payload)


def _relay_with_question() -> StructuredInterviewRelay:
    ws = _FakeWS()
    relay = StructuredInterviewRelay(ws, token="tok", language="en")  # type: ignore[arg-type]
    relay.store = None
    relay.db_session_id = "sess-1"
    q = SimpleNamespace(id="q1", prompt="Hello?", section="hr", time_limit_seconds=60)
    relay.session = InterviewSession(questions=[q], overall_limit_seconds=600)
    relay.session.status = SessionStatus.IN_PROGRESS
    relay.session.current_index = 0
    now = datetime.now(timezone.utc)
    relay.session.started_at = now
    relay.session.question_started_at = now
    return relay


@pytest.mark.asyncio
async def test_submit_answer_rejects_failed_chunk_assemble() -> None:
    relay = _relay_with_question()

    with patch(
        "interview.structured_relay.assemble_answer_audio",
        new=AsyncMock(side_effect=RuntimeError("Download failed: 400")),
    ), patch.object(relay, "_advance_locked", new=AsyncMock()) as advance:
        await relay._handle_submit_answer(
            {
                "type": "submit_answer",
                "question_index": 0,
                "chunk_count": 3,
                "mime_type": "audio/webm",
            }
        )

    assert any(m.get("type") == "answer_error" for m in relay.websocket.sent)  # type: ignore[attr-defined]
    assert relay.session.transcripts == []
    advance.assert_not_awaited()


@pytest.mark.asyncio
async def test_submit_answer_rejects_empty_inline_audio() -> None:
    relay = _relay_with_question()

    with patch.object(relay, "_advance_locked", new=AsyncMock()) as advance:
        await relay._handle_submit_answer(
            {
                "type": "submit_answer",
                "question_index": 0,
                "audio_base64": "",
                "mime_type": "audio/webm",
            }
        )

    assert any(m.get("type") == "answer_error" for m in relay.websocket.sent)  # type: ignore[attr-defined]
    assert relay.session.transcripts == []
    advance.assert_not_awaited()


@pytest.mark.asyncio
async def test_submit_answer_accepts_inline_base64() -> None:
    relay = _relay_with_question()
    audio = base64.b64encode(b"fake-webm-bytes").decode()

    with patch.object(relay, "_advance_locked", new=AsyncMock()) as advance, patch.object(
        relay,
        "_transcribe_in_background",
        new=AsyncMock(),
    ), patch("asyncio.create_task") as create_task:
        create_task.side_effect = lambda coro: AsyncMock()  # don't schedule real work
        await relay._handle_submit_answer(
            {
                "type": "submit_answer",
                "question_index": 0,
                "audio_base64": audio,
                "mime_type": "audio/webm",
            }
        )

    assert any(m.get("type") == "answer_received" for m in relay.websocket.sent)  # type: ignore[attr-defined]
    assert len(relay.session.transcripts) == 1
    advance.assert_awaited()
