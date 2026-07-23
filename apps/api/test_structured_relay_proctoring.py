"""Regression tests for terminal proctoring violations."""

import unittest
from unittest.mock import AsyncMock

from interview.session import SessionStatus
from interview.structured_relay import StructuredInterviewRelay


class _Store:
    async def flag_session_proctoring(self, session_id: str, *, summary: dict) -> None:
        return None


class StructuredRelayProctoringTests(unittest.IsolatedAsyncioTestCase):
    async def test_flagging_a_session_terminates_the_interview(self) -> None:
        relay = StructuredInterviewRelay(AsyncMock())
        relay.store = _Store()
        relay.db_session_id = "session-1"
        relay._proctoring_warnings = 15
        relay._proctoring_critical = 0
        relay._send_json = AsyncMock()
        relay._complete_interview = AsyncMock()

        await relay._flag_proctoring_session("Repeated tab switches")

        relay._complete_interview.assert_awaited_once_with(status=SessionStatus.FLAGGED)
        relay._send_json.assert_awaited_once()


if __name__ == "__main__":
    unittest.main()
