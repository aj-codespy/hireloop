"""Regression: oversized WS text must not tear down the interview socket."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest


@pytest.mark.asyncio
async def test_oversized_text_is_dropped_without_closing() -> None:
    """Proctoring JPEG frames exceed the old 20KB cap; closing caused reconnect loops."""
    import main as api_main

    websocket = MagicMock()
    websocket.client = ("1.2.3.4", 12345)
    websocket.accept = AsyncMock()
    websocket.send_json = AsyncMock()
    websocket.close = AsyncMock()
    websocket.receive = AsyncMock(
        side_effect=[
            {"type": "websocket.receive", "text": "x" * (api_main.MAX_WS_MESSAGE_BYTES + 1)},
            {"type": "websocket.disconnect"},
        ]
    )

    store = MagicMock()
    store.load_application_for_interview = AsyncMock(return_value={"ok": True})

    relay = MagicMock()
    relay.run = AsyncMock()
    relay.handle_client_message = AsyncMock()
    relay.client_disconnected = MagicMock()

    with patch.object(api_main, "get_store", return_value=store), patch.object(
        api_main, "StructuredInterviewRelay", return_value=relay
    ), patch.object(api_main, "_CONNECTIONS_BY_IP", {}), patch.object(
        api_main, "_CONNECTIONS_LOCK", __import__("asyncio").Lock()
    ):
        await api_main.interview_websocket(websocket, token="tok", lang="en")

    relay.handle_client_message.assert_not_awaited()
    # Must not close for message-too-large (code 4003).
    for call in websocket.close.await_args_list:
        assert call.kwargs.get("code") != 4003
