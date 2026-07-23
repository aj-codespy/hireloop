"""Calendar sync service for HireLoop V1."""

from __future__ import annotations

import logging
import os
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Any, Optional
from uuid import uuid4

import httpx

from config import supabase_enabled
from interview.supabase_store import get_store

logger = logging.getLogger(__name__)


class CalendarProvider(str, Enum):
    GOOGLE = "google"
    OUTLOOK = "outlook"


@dataclass
class CalendarConnection:
    id: str
    org_id: str
    user_id: str
    provider: CalendarProvider
    access_token_encrypted: str
    refresh_token_encrypted: str
    expires_at: datetime
    calendars: list[dict] = field(default_factory=list)
    active: bool = True
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


@dataclass
class TimeSlot:
    start: datetime
    end: datetime
    interviewer_ids: list[str]


class GoogleCalendarClient:
    """Google Calendar API client."""

    BASE_URL = "https://www.googleapis.com/calendar/v3"
    TOKEN_URL = "https://oauth2.googleapis.com/token"
    AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"

    def __init__(self, access_token: str, refresh_token: str = None):
        self.access_token = access_token
        self.refresh_token = refresh_token
        self.client = httpx.AsyncClient(timeout=30.0)

    async def _request(self, method: str, path: str, **kwargs) -> dict:
        headers = {"Authorization": f"Bearer {self.access_token}", **kwargs.pop("headers", {})}
        response = await self.client.request(method, f"{self.BASE_URL}{path}", headers=headers, **kwargs)

        if response.status_code == 401 and self.refresh_token:
            # Try to refresh token
            await self._refresh_token()
            headers["Authorization"] = f"Bearer {self.access_token}"
            response = await self.client.request(method, f"{self.BASE_URL}{path}", headers=headers, **kwargs)

        if response.status_code >= 400:
            raise RuntimeError(f"Google Calendar API error: {response.status_code} {response.text}")

        return response.json()

    async def _refresh_token(self) -> None:
        client_id = os.getenv("GOOGLE_CLIENT_ID")
        client_secret = os.getenv("GOOGLE_CLIENT_SECRET")

        if not client_id or not client_secret:
            raise RuntimeError("Google OAuth credentials not configured")

        data = {
            "client_id": client_id,
            "client_secret": client_secret,
            "refresh_token": self.refresh_token or "",
            "grant_type": "refresh_token",
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(self.TOKEN_URL, data=data)
            if response.status_code >= 400:
                raise RuntimeError(f"Failed to refresh Google token: {response.text}")

            tokens = response.json()
            self.access_token = tokens["access_token"]
            if "refresh_token" in tokens:
                self.refresh_token = tokens["refresh_token"]

            # Store updated tokens (would need to persist to DB)
            # await self._store_tokens(tokens)

    async def list_calendars(self) -> list[dict]:
        """List all calendars for the authenticated user."""
        response = await self._request("GET", "/users/me/calendarList")
        return response.get("items", [])

    async def get_free_busy(
        self,
        calendar_ids: list[str],
        time_min: datetime,
        time_max: datetime,
    ) -> dict:
        """Get free/busy information for calendars."""
        body = {
            "timeMin": time_min.isoformat(),
            "timeMax": time_max.isoformat(),
            "items": [{"id": cal_id} for cal_id in calendar_ids],
        }
        return await self._request("POST", "/freeBusy", json=body)

    async def create_event(self, calendar_id: str, event: dict) -> dict:
        """Create an event in a calendar."""
        return await self._request("POST", f"/calendars/{calendar_id}/events", json=event)

    async def update_event(self, calendar_id: str, event_id: str, event: dict) -> dict:
        """Update an event."""
        return await self._request("PUT", f"/calendars/{calendar_id}/events/{event_id}", json=event)

    async def delete_event(self, calendar_id: str, event_id: str) -> None:
        """Delete an event."""
        await self._request("DELETE", f"/calendars/{calendar_id}/events/{event_id}")


class OutlookCalendarClient:
    """Microsoft Outlook Calendar (Microsoft Graph) client."""

    BASE_URL = "https://graph.microsoft.com/v1.0"
    TOKEN_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/token"
    AUTH_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize"

    SCOPES = ["Calendars.ReadWrite", "offline_access"]

    def __init__(self, access_token: str, refresh_token: str = None):
        self.access_token = access_token
        self.refresh_token = refresh_token
        self.client = httpx.AsyncClient(timeout=30.0)

    async def _request(self, method: str, path: str, **kwargs) -> dict:
        headers = {"Authorization": f"Bearer {self.access_token}", **kwargs.pop("headers", {})}
        response = await self.client.request(method, f"{self.BASE_URL}{path}", headers=headers, **kwargs)

        if response.status_code == 401 and self.refresh_token:
            await self._refresh_token()
            headers["Authorization"] = f"Bearer {self.access_token}"
            response = await self.client.request(method, f"{self.BASE_URL}{path}", headers=headers, **kwargs)

        if response.status_code >= 400:
            raise RuntimeError(f"Outlook Calendar API error: {response.status_code} {response.text}")

        return response.json()

    async def _refresh_token(self) -> None:
        client_id = os.getenv("OUTLOOK_CLIENT_ID")
        client_secret = os.getenv("OUTLOOK_CLIENT_SECRET")

        if not client_id or not client_secret:
            raise RuntimeError("Outlook OAuth credentials not configured")

        data = {
            "client_id": client_id,
            "client_secret": client_secret,
            "refresh_token": self.refresh_token,
            "grant_type": "refresh_token",
            "scope": " ".join(self.SCOPES),
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(self.TOKEN_URL, data=data)
            if response.status_code >= 400:
                raise RuntimeError(f"Failed to refresh Outlook token: {response.text}")

            tokens = response.json()
            self.access_token = tokens["access_token"]
            if "refresh_token" in tokens:
                self.refresh_token = tokens["refresh_token"]

    async def list_calendars(self) -> list[dict]:
        """List all calendars for the authenticated user."""
        response = await self._request("GET", "/me/calendars")
        return response.get("value", [])

    async def get_schedule(
        self,
        calendar_ids: list[str],
        start_time: datetime,
        end_time: datetime,
    ) -> dict:
        """Get free/busy schedule for calendars."""
        body = {
            "schedules": calendar_ids,
            "startTime": {
                "dateTime": start_time.isoformat(),
                "timeZone": "UTC",
            },
            "endTime": {
                "dateTime": end_time.isoformat(),
                "timeZone": "UTC",
            },
            "availabilityViewInterval": 30,
        }
        return await self._request("POST", "/users/me/calendar/getSchedule", json=body)

    async def create_event(self, calendar_id: str, event: dict) -> dict:
        """Create an event in a calendar."""
        return await self._request("POST", f"/me/calendars/{calendar_id}/events", json=event)

    async def update_event(self, event_id: str, event: dict) -> dict:
        """Update an event."""
        return await self._request("PATCH", f"/me/events/{event_id}", json=event)

    async def delete_event(self, event_id: str) -> None:
        """Delete an event."""
        await self._request("DELETE", f"/me/events/{event_id}")


# ============================================================
# Calendar Sync Service
# ============================================================

class CalendarSyncService:
    """Service for managing calendar connections and syncing availability."""

    def __init__(self):
        self.connections: dict[str, CalendarConnection] = {}

    def get_client(self, connection: CalendarConnection) -> GoogleCalendarClient | OutlookCalendarClient:
        """Get the appropriate calendar client for a connection."""
        if connection.provider == CalendarProvider.GOOGLE:
            return GoogleCalendarClient(
                access_token=connection.access_token_encrypted,  # Should be decrypted
                refresh_token=connection.refresh_token_encrypted,
            )
        elif connection.provider == CalendarProvider.OUTLOOK:
            return OutlookCalendarClient(
                access_token=connection.access_token_encrypted,
                refresh_token=connection.refresh_token_encrypted,
            )
        else:
            raise ValueError(f"Unsupported provider: {connection.provider}")

    async def sync_interviewer_availability(
        self,
        org_id: str,
        interviewer_ids: list[str],
        days_ahead: int = 30,
    ) -> list[TimeSlot]:
        """
        Sync availability for multiple interviewers and return common free slots.

        Args:
            org_id: Organization ID
            interviewer_ids: List of user IDs (profiles) to check
            days_ahead: How many days ahead to check

        Returns:
            List of TimeSlot objects representing common free time
        """
        store = get_store()
        if not store:
            raise RuntimeError("Database not configured")

        # Get calendar connections for interviewers
        connections = []
        for interviewer_id in interviewer_ids:
            rows = await store._request(
                "GET",
                "calendar_connections",
                params={
                    "user_id": f"eq.{interviewer_id}",
                    "active": "eq.true",
                },
            )
            if rows:
                connections.append(CalendarConnection(**rows[0]))

        if not connections:
            logger.warning(f"No active calendar connections found for interviewers: {interviewer_ids}")
            return []

        # Get free/busy for each connection
        now = datetime.now(timezone.utc)
        time_max = now + timedelta(days=days_ahead)

        all_busy_periods = []

        for conn in connections:
            client = self.get_client(conn)

            # Get selected calendar IDs from connection config
            calendar_ids = [c["id"] for c in conn.calendars if c.get("selected")] or [conn.calendars[0]["id"]]

            if isinstance(client, GoogleCalendarClient):
                fb = await client.get_free_busy(calendar_ids, now, now + timedelta(days=days_ahead))
                for cal_id, cal_fb in fb.get("calendars", {}).items():
                    for busy in cal_fb.get("busy", []):
                        all_busy_periods.append({
                            "start": datetime.fromisoformat(busy["start"].replace("Z", "+00:00")),
                            "end": datetime.fromisoformat(busy["end"].replace("Z", "+00:00")),
                            "interviewer": conn.user_id,
                        })
            else:  # Outlook
                schedule = await client.get_schedule(calendar_ids, now, now + timedelta(days=days_ahead))
                for schedule_item in schedule.get("value", []):
                    for busy in schedule_item.get("scheduleItems", []):
                        all_busy_periods.append({
                            "start": datetime.fromisoformat(busy["start"]["dateTime"].replace("Z", "+00:00")),
                            "end": datetime.fromisoformat(busy["end"]["dateTime"].replace("Z", "+00:00")),
                            "interviewer": conn.user_id,
                        })

        # Find common free slots (simplified - find gaps where NO interviewer is busy)
        # In production, use a more sophisticated algorithm
        free_slots = self._find_common_free_slots(all_busy_periods, now, now + timedelta(days=days_ahead))

        return free_slots

    async def create_interview_slots(
        self,
        schedule_id: str,
        interviewer_ids: list[str],
        start_date: datetime,
        end_date: datetime,
        slot_duration_minutes: int = 60,
        buffer_minutes: int = 15,
    ) -> list[dict]:
        """
        Create interview slots for a schedule based on interviewer availability.

        Args:
            schedule_id: Interview schedule ID
            interviewer_ids: List of interviewer user IDs
            start_date: Start date for slot generation
            end_date: End date for slot generation
            slot_duration_minutes: Duration of each interview slot
            buffer_minutes: Buffer between slots

        Returns:
            List of created slot IDs
        """
        store = get_store()
        if not store:
            raise RuntimeError("Database not configured")

        # Get interviewer availability
        free_slots = await self.sync_interviewer_availability(
            org_id="",  # Would need org_id
            interviewer_ids=interviewer_ids,
            days_ahead=(end_date - datetime.now(timezone.utc)).days,
        )

        # Create slots based on free time
        slots = []
        slot_duration = timedelta(minutes=slot_duration_minutes)
        buffer = timedelta(minutes=buffer_minutes)

        for free_slot in free_slots:
            current = free_slot.start
            while current + slot_duration <= free_slot.end:
                slot = {
                    "id": str(uuid4()),
                    "schedule_id": schedule_id,
                    "starts_at": current.isoformat(),
                    "ends_at": (current + slot_duration).isoformat(),
                    "interviewer_ids": interviewer_ids,
                    "max_candidates": 1,
                    "status": "available",
                    "created_at": datetime.now(timezone.utc).isoformat(),
                }
                slots.append(slot)
                current += slot_duration + buffer

        # Save to database
        if slots:
            await get_store()._request("POST", "interview_slots", json=slots)

        return slots

    async def book_slot(
        self,
        slot_id: str,
        candidate_id: str,
        meeting_url: str = None,
    ) -> dict:
        """Book an interview slot for a candidate."""
        store = get_store()
        if not store:
            raise RuntimeError("Database not configured")

        # Update slot
        updates = {
            "status": "booked",
            "booked_by": candidate_id,
            "booked_at": datetime.now(timezone.utc).isoformat(),
        }
        if meeting_url:
            updates["meeting_url"] = meeting_url

        await store._request(
            "PATCH",
            "interview_slots",
            params={"id": f"eq.{slot_id}"},
            json=updates,
        )

        # Create interview schedule record
        slot_rows = await store._request(
            "GET", "interview_slots", params={"id": f"eq.{slot_id}"}
        )
        if slot_rows:
            slot = slot_rows[0]
            schedule_payload = {
                "id": str(uuid4()),
                "schedule_id": slot["schedule_id"],
                "starts_at": slot["starts_at"],
                "ends_at": slot["ends_at"],
                "meeting_url": slot.get("meeting_url"),
                "attendee_ids": slot.get("interviewer_ids", []),
                "status": "scheduled",
            }
            await store._request("POST", "interview_schedules", json=schedule_payload)

        return {"success": True, "slot_id": slot_id}


# ============================================================
# OAuth Helpers
# ============================================================

class GoogleOAuth:
    """Google OAuth 2.0 helper."""

    AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
    TOKEN_URL = "https://oauth2.googleapis.com/token"
    SCOPES = [
        "https://www.googleapis.com/auth/calendar.readonly",
        "https://www.googleapis.com/auth/calendar.events",
        "offline_access",
    ]

    @staticmethod
    def get_auth_url(state: str, redirect_uri: str) -> str:
        client_id = os.getenv("GOOGLE_CLIENT_ID")
        params = {
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": " ".join(GoogleOAuth.SCOPES),
            "state": state,
            "access_type": "offline",
            "prompt": "consent",
        }
        return f"{GoogleOAuth.AUTH_URL}?{httpx.QueryParams(params)}"

    @staticmethod
    async def exchange_code(code: str, redirect_uri: str) -> dict:
        client_id = os.getenv("GOOGLE_CLIENT_ID")
        client_secret = os.getenv("GOOGLE_CLIENT_SECRET")

        if not client_id or not client_secret:
            raise RuntimeError("Google OAuth credentials not configured")

        data = {
            "client_id": client_id,
            "client_secret": client_secret,
            "code": code,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
        }

        async with httpx.AsyncClient() as client:
            response = await client.post("https://oauth2.googleapis.com/token", data=data)
            if response.status_code >= 400:
                raise RuntimeError(f"Failed to exchange Google code: {response.text}")
            return response.json()


class OutlookOAuth:
    """Microsoft Outlook OAuth 2.0 helper."""

    AUTH_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize"
    TOKEN_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/token"
    SCOPES = ["Calendars.ReadWrite", "offline_access"]

    @staticmethod
    def get_auth_url(state: str, redirect_uri: str) -> str:
        client_id = os.getenv("OUTLOOK_CLIENT_ID")
        params = {
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": " ".join(OutlookOAuth.SCOPES),
            "state": state,
        }
        return f"{OutlookOAuth.AUTH_URL}?{httpx.QueryParams(params)}"

    @staticmethod
    async def exchange_code(code: str, redirect_uri: str) -> dict:
        client_id = os.getenv("OUTLOOK_CLIENT_ID")
        client_secret = os.getenv("OUTLOOK_CLIENT_SECRET")

        if not client_id or not client_secret:
            raise RuntimeError("Outlook OAuth credentials not configured")

        data = {
            "client_id": client_id,
            "client_secret": client_secret,
            "code": code,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
            "scope": " ".join(OutlookOAuth.SCOPES),
        }

        async with httpx.AsyncClient() as client:
            response = await client.post("https://login.microsoftonline.com/common/oauth2/v2.0/token", data=data)
            if response.status_code >= 400:
                raise RuntimeError(f"Failed to exchange Outlook code: {response.text}")
            return response.json()


# ============================================================
# Integration with Supabase Store
# ============================================================

async def save_calendar_connection(
    org_id: str,
    user_id: str,
    provider: CalendarProvider,
    access_token: str,
    refresh_token: str,
    expires_at: datetime,
    calendars: list[dict],
) -> str:
    """Save calendar connection to database."""
    store = get_store()
    if not store:
        raise RuntimeError("Database not configured")

    conn_id = f"cal-{uuid4().hex[:12]}"
    payload = {
        "id": f"cal-{uuid4().hex[:12]}",
        "org_id": org_id,
        "user_id": user_id,
        "provider": provider.value,
        "access_token_encrypted": access_token,  # Should be encrypted in production
        "refresh_token_encrypted": refresh_token,
        "expires_at": expires_at.isoformat(),
        "calendars": calendars,
        "active": True,
    }

    await get_store()._request("POST", "calendar_connections", json=payload)
    return conn_id


async def get_user_calendar_connections(user_id: str) -> list[CalendarConnection]:
    """Get all active calendar connections for a user."""
    store = get_store()
    if not store:
        return []

    rows = await get_store()._request(
        "GET",
        "calendar_connections",
        params={"user_id": f"eq.{user_id}", "active": "eq.true"},
    )
    return [CalendarConnection(**row) for row in rows or []]


# ============================================================
# Utility Functions
# ============================================================

def find_common_free_slots(
    busy_periods: list[dict],
    start: datetime,
    end: datetime,
    min_duration: timedelta = timedelta(minutes=30),
) -> list[TimeSlot]:
    """
    Find common free slots across multiple interviewers.

    Args:
        busy_periods: List of busy periods with start, end, interviewer
        start: Start of search window
        end: End of search window
        min_duration: Minimum slot duration

    Returns:
        List of free time slots
    """
    # Collect all busy intervals
    intervals = []
    for bp in busy_periods:
        intervals.append((bp["start"], bp["end"]))

    if not intervals:
        # No busy periods - entire window is free
        return [TimeSlot(start=start, end=end, interviewer_ids=[])]

    # Sort and merge intervals
    intervals.sort(key=lambda x: x[0])
    merged = []
    for start_i, end_i in intervals:
        if not merged or start_i > merged[-1][1]:
            merged.append([start_i, end_i])
        else:
            merged[-1][1] = max(merged[-1][1], end_i)

    # Find gaps
    free_slots = []
    current = start

    for busy_start, busy_end in merged:
        if current + timedelta(minutes=30) <= busy_start:
            free_slots.append(TimeSlot(
                start=current,
                end=busy_start,
                interviewer_ids=[],
            ))
        current = max(current, busy_end)

    # Check after last busy period
    if current + timedelta(minutes=30) <= end:
        free_slots.append(TimeSlot(start=current, end=end, interviewer_ids=[]))

    return free_slots


def generate_slots_from_free_time(
    free_slots: list[TimeSlot],
    slot_duration: timedelta,
    buffer: timedelta,
    max_candidates: int = 1,
) -> list[dict]:
    """Generate interview slots from free time slots."""
    slots = []
    for free in free_slots:
        current = free.start
        while current + slot_duration <= free.end:
            slots.append({
                "id": str(uuid4()),
                "starts_at": current.isoformat(),
                "ends_at": (current + slot_duration).isoformat(),
                "max_candidates": max_candidates,
                "status": "available",
            })
            current += slot_duration + buffer
    return slots