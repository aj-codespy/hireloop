"""Tests for the webhook dispatch worker: pending-event sweep, retry/delivery, and store parsing."""

import sys
import types

# Config stub
cfg = types.ModuleType("config")
cfg.SUPABASE_URL = "http://localhost"
cfg.SUPABASE_SECRET_KEY = "x"
cfg.DEV_SQLITE = False
cfg.DEV_SQLITE_PATH = "/tmp/test.sqlite"
cfg.supabase_enabled = lambda: False
cfg.PORT = 8000
sys.modules["config"] = cfg

from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest

from interview.webhooks import WebhookDispatcher, WebhookEvent
from interview.supabase_store import SupabaseInterviewStore


def _fake_response(status_code: int, text: str = "ok"):
    r = MagicMock()
    r.status_code = status_code
    r.text = text
    return r


# ---------------------------------------------------------------------------
# Dispatcher.process_retries — full sweep
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_process_retries_delivers_matching_subscription():
    """Pending event + matching active subscription → delivered, status updated."""
    store = AsyncMock()
    event = WebhookEvent(
        id="evt_1",
        org_id="org_1",
        event_type="candidate.qualified",
        payload={"event_id": "evt_1", "data": {"candidate_id": "cand_1"}},
        status="pending",
        attempts=0,
    )
    store.get_pending_webhook_events = AsyncMock(return_value=[event])
    store.get_webhook_subscriptions = AsyncMock(
        return_value=[
            {
                "id": "wh_1",
                "url": "https://customer.example.com/hook",
                "secret": "whsec_test",
                "events": ["candidate.qualified"],
                "active": True,
            }
        ]
    )
    store.update_webhook_event = AsyncMock()

    http_client = AsyncMock()
    http_client.post = AsyncMock(return_value=_fake_response(200))

    dispatcher = WebhookDispatcher(http_client, store)
    await dispatcher.process_retries()

    assert event.status == "delivered"
    assert event.attempts == 1
    store.update_webhook_event.assert_called_once_with(event)
    # Subscriptions fetched for the event's org + event type
    store.get_webhook_subscriptions.assert_awaited_once_with("org_1", "candidate.qualified")


@pytest.mark.asyncio
async def test_process_retries_skips_nonmatching_subscription():
    """Subscription that doesn't listen to the event type → no delivery attempt."""
    store = AsyncMock()
    event = WebhookEvent(
        id="evt_2",
        org_id="org_1",
        event_type="candidate.qualified",
        payload={"event_id": "evt_2"},
        status="pending",
        attempts=0,
    )
    store.get_pending_webhook_events = AsyncMock(return_value=[event])
    store.get_webhook_subscriptions = AsyncMock(
        return_value=[
            {
                "id": "wh_2",
                "url": "https://customer.example.com/hook",
                "secret": "s",
                "events": ["application.created"],  # not candidate.qualified
                "active": True,
            }
        ]
    )
    store.update_webhook_event = AsyncMock()

    http_client = AsyncMock()
    http_client.post = AsyncMock(return_value=_fake_response(200))

    dispatcher = WebhookDispatcher(http_client, store)
    await dispatcher.process_retries()

    http_client.post.assert_not_awaited()
    assert event.status == "pending"  # untouched
    store.update_webhook_event.assert_not_called()


@pytest.mark.asyncio
async def test_process_retries_retries_on_500_then_delivers():
    """5xx → next_retry_at scheduled, event stays pending; sweep delivers after retry window."""
    store = AsyncMock()
    event = WebhookEvent(
        id="evt_3",
        org_id="org_1",
        event_type="candidate.qualified",
        payload={"event_id": "evt_3"},
        status="pending",
        attempts=1,
        next_retry_at=datetime.fromtimestamp(
            datetime.now(timezone.utc).timestamp(), tz=timezone.utc
        ),  # retry window passed
    )
    store.get_pending_webhook_events = AsyncMock(return_value=[event])
    store.get_webhook_subscriptions = AsyncMock(
        return_value=[
            {
                "id": "wh_3",
                "url": "https://customer.example.com/hook",
                "secret": "s",
                "events": ["candidate.qualified"],
                "active": True,
            }
        ]
    )
    store.update_webhook_event = AsyncMock()

    http_client = AsyncMock()
    http_client.post = AsyncMock(return_value=_fake_response(200))

    dispatcher = WebhookDispatcher(http_client, store)
    await dispatcher.process_retries()

    assert event.status == "delivered"
    assert event.attempts == 2


@pytest.mark.asyncio
async def test_process_retries_does_not_touch_future_retry():
    """Event with next_retry_at in the future must NOT be delivered early."""
    store = AsyncMock()
    event = WebhookEvent(
        id="evt_4",
        org_id="org_1",
        event_type="candidate.qualified",
        payload={"event_id": "evt_4"},
        status="pending",
        attempts=1,
        next_retry_at=datetime.fromtimestamp(
            datetime.now(timezone.utc).timestamp() + 3600, tz=timezone.utc
        ),  # 1h in future
    )
    store.get_pending_webhook_events = AsyncMock(return_value=[event])
    store.get_webhook_subscriptions = AsyncMock(return_value=[])

    http_client = AsyncMock()
    http_client.post = AsyncMock(return_value=_fake_response(200))

    dispatcher = WebhookDispatcher(http_client, store)
    await dispatcher.process_retries()

    http_client.post.assert_not_awaited()
    assert event.status == "pending"


# ---------------------------------------------------------------------------
# Store queue methods — row parsing
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_store_get_pending_webhook_events_parses_rows():
    """Rows from PostgREST are parsed into WebhookEvent objects (payload JSON)."""
    store = object.__new__(SupabaseInterviewStore)
    store._request = AsyncMock(
        return_value=[
            {
                "id": "evt_5",
                "org_id": "org_1",
                "event_type": "candidate.qualified",
                "payload": {"application_id": "app_1"},
                "status": "pending",
                "attempts": 0,
                "last_attempt_at": None,
                "next_retry_at": None,
                "response_code": None,
                "response_body": None,
                "created_at": "2026-08-02T12:00:00Z",
            }
        ]
    )

    events = await store.get_pending_webhook_events()

    assert len(events) == 1
    evt = events[0]
    assert isinstance(evt, WebhookEvent)
    assert evt.id == "evt_5"
    assert evt.org_id == "org_1"
    assert evt.event_type == "candidate.qualified"
    assert evt.payload == {"application_id": "app_1"}
    assert evt.status == "pending"
    assert evt.attempts == 0
    # Query only asks for pending/failed events whose retry window is open
    params = store._request.call_args.kwargs["params"]
    assert params["status"] == "in.(pending,failed)"
    assert params["or"].startswith("(next_retry_at.is.null,next_retry_at.lte.")


@pytest.mark.asyncio
async def test_store_update_webhook_event_patches_by_id():
    """Delivery result fields are PATCHed to the event row."""
    store = object.__new__(SupabaseInterviewStore)
    store._request = AsyncMock(return_value=None)

    event = WebhookEvent(
        id="evt_6",
        org_id="org_1",
        event_type="candidate.qualified",
        payload={},
        status="delivered",
        attempts=2,
        response_code=200,
        response_body="ok",
    )
    await store.update_webhook_event(event)

    call = store._request.call_args
    assert call.args[0] == "PATCH"
    assert call.kwargs["params"] == {"id": "eq.evt_6"}
    body = call.kwargs["json"]
    assert body["status"] == "delivered"
    assert body["attempts"] == 2
    assert body["response_code"] == 200
    assert body["response_body"] == "ok"
