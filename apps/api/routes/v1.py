"""REST API v1 routes for HireLoop."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request
from pydantic import BaseModel, Field

from interview.api_keys import (
    AuthenticatedKey,
    SCOPE_READ,
    SCOPE_WRITE,
    SCOPE_ADMIN,
    SCOPES,
    generate_key,
    normalize_scopes,
    verify_key,
)
from interview.supabase_store import get_store
from interview.webhooks import WebhookEventType, build_webhook_payload, sign_payload

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1", tags=["v1"])


# ---------------------------------------------------------------------------
# API key authentication
# ---------------------------------------------------------------------------
async def get_auth(x_api_key: str | None = Header(None, alias="X-API-Key")) -> AuthenticatedKey:
    """Validate the presented API key (bcrypt) and return the authenticated key."""
    if not x_api_key:
        raise HTTPException(status_code=401, detail="Missing X-API-Key header")

    store = get_store()
    if not store:
        raise HTTPException(status_code=503, detail="Database not configured")

    # bcrypt has no direct lookup by plaintext, so we iterate active key hashes.
    # Org-level key counts are small (dozens); this is negligible overhead.
    rows = await store._request(
        "GET",
        "api_keys",
        params={"active": "eq.true", "select": "id,org_id,key_hash,scopes,expires_at"},
    )
    if not rows:
        raise HTTPException(status_code=401, detail="Invalid API key")

    now = datetime.now(timezone.utc)
    for row in rows:
        if row.get("expires_at") and datetime.fromisoformat(row["expires_at"].replace("Z", "+00:00")) < now:
            continue
        if verify_key(x_api_key, row["key_hash"]):
            await store.mark_api_key_used(row["id"])
            return AuthenticatedKey(
                key_id=row["id"],
                org_id=row["org_id"],
                scopes=normalize_scopes(row.get("scopes") or []),
            )
    raise HTTPException(status_code=401, detail="Invalid API key")


async def get_org_id(auth: AuthenticatedKey = Depends(get_auth)) -> str:
    """Thin wrapper so existing routes keep receiving ``org_id: str``."""
    return auth.org_id


def require_scopes(*resources: str, mode: str = "write"):
    """Dependency factory enforcing a read/write/admin scope on a resource.

    Returns the authenticated key; admin scope satisfies any requirement.
    """
    async def _dep(auth: AuthenticatedKey = Depends(get_auth)) -> AuthenticatedKey:
        req = SCOPE_ADMIN if mode == "admin" else (SCOPE_WRITE if mode == "write" else SCOPE_READ)
        if SCOPE_ADMIN in auth.scopes:
            return auth
        if req not in auth.scopes:
            raise HTTPException(
                status_code=403,
                detail=f"API key missing required scope '{req}' for resources {list(resources)}",
            )
        return auth

    return _dep



# Pydantic models
class JobCreate(BaseModel):
    title: str
    description: str = ""
    department_id: Optional[str] = None
    status: str = "draft"
    eligibility_rules: list[dict] = []
    passing_score: Optional[float] = None
    interview_question_count: Optional[int] = None
    form_fields: list[dict] = []


class JobUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    department_id: Optional[str] = None
    status: Optional[str] = None
    eligibility_rules: Optional[list[dict]] = None
    passing_score: Optional[float] = None
    interview_question_count: Optional[int] = None
    form_fields: Optional[list[dict]] = None
    custom_scoring_rules: Optional[dict] = None


class ApplicationTransition(BaseModel):
    to_status: str
    reason: Optional[str] = None


class ScorecardCreate(BaseModel):
    recommendation: str = Field(..., pattern="^(strong_yes|yes|hold|no|strong_no)$")
    overall_score: Optional[float] = None
    competencies: list[dict] = []
    notes: Optional[str] = None


class ScheduleCreate(BaseModel):
    stage_id: str
    starts_at: str
    ends_at: str
    location: Optional[str] = None
    meeting_url: Optional[str] = None
    attendee_ids: list[str] = []


class WebhookSubscriptionCreate(BaseModel):
    url: str
    events: list[str]
    description: Optional[str] = None


class ExportConfigCreate(BaseModel):
    name: str
    type: str
    schedule: dict
    format: str = "csv"
    destination: dict
    filters: Optional[dict] = None
    field_mapping: Optional[dict] = None


# Jobs endpoints
@router.get("/jobs")
async def list_jobs(
    org_id: str = Depends(get_org_id),
    status: Optional[str] = Query(None),
    department_id: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    cursor: Optional[str] = Query(None),
):
    store = get_store()
    if not store:
        raise HTTPException(status_code=503, detail="Database not configured")

    params = {"org_id": f"eq.{org_id}", "order": "created_at.desc", "limit": str(limit)}
    if status:
        params["status"] = f"eq.{status}"
    if department_id:
        params["department_id"] = f"eq.{department_id}"

    rows = await store._request("GET", "job_roles", params=params)
    return {"data": rows or [], "next_cursor": None}


@router.post("/jobs", status_code=201)
async def create_job(job: JobCreate, auth: AuthenticatedKey = Depends(require_scopes("jobs", mode="write"))):
    store = get_store()
    if not store:
        raise HTTPException(status_code=503, detail="Database not configured")

    job_id = f"job-{uuid4().hex[:12]}"
    payload = {
        "id": job_id,
        "org_id": auth.org_id,
        "title": job.title,
        "description": job.description,
        "department_id": job.department_id,
        "status": job.status,
        "eligibility_rules": job.eligibility_rules,
        "passing_score": job.passing_score,
        "interview_question_count": job.interview_question_count,
        "form_fields": job.form_fields,
    }

    await store._request("POST", "job_roles", json=payload)
    return {"id": job_id, **payload}


@router.get("/jobs/{job_id}")
async def get_job(job_id: str, org_id: str = Depends(get_org_id)):
    store = get_store()
    if not store:
        raise HTTPException(status_code=503, detail="Database not configured")

    rows = await store._request(
        "GET",
        "job_roles",
        params={"id": f"eq.{job_id}", "org_id": f"eq.{org_id}"},
    )
    if not rows:
        raise HTTPException(status_code=404, detail="Job not found")
    return rows[0]


@router.patch("/jobs/{job_id}")
async def update_job(job_id: str, job: JobUpdate, auth: AuthenticatedKey = Depends(require_scopes("jobs", mode="write"))):
    store = get_store()
    if not store:
        raise HTTPException(status_code=503, detail="Database not configured")

    update_data = job.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

    await store._request(
        "PATCH",
        "job_roles",
        params={"id": f"eq.{job_id}", "org_id": f"eq.{auth.org_id}"},
        json=update_data,
    )
    return {"id": job_id, **update_data}


@router.delete("/jobs/{job_id}")
async def delete_job(job_id: str, auth: AuthenticatedKey = Depends(require_scopes("jobs", mode="write"))):
    store = get_store()
    if not store:
        raise HTTPException(status_code=503, detail="Database not configured")

    await store._request(
        "DELETE",
        "job_roles",
        params={"id": f"eq.{job_id}", "org_id": f"eq.{auth.org_id}"},
    )
    return {"success": True}


# Applications endpoints
@router.get("/applications")
async def list_applications(
    org_id: str = Depends(get_org_id),
    job_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    stage_id: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    cursor: Optional[str] = Query(None),
):
    store = get_store()
    if not store:
        raise HTTPException(status_code=503, detail="Database not configured")

    params = {"org_id": f"eq.{org_id}", "order": "created_at.desc", "limit": "50"}
    if job_id:
        params["job_role_id"] = f"eq.{job_id}"
    if status:
        params["status"] = f"eq.{status}"
    if stage_id:
        params["current_stage_id"] = f"eq.{stage_id}"

    rows = await store._request("GET", "applications", params=params)
    return {"data": rows or [], "next_cursor": None}


@router.get("/applications/{app_id}")
async def get_application(app_id: str, org_id: str = Depends(get_org_id)):
    store = get_store()
    if not store:
        raise HTTPException(status_code=503, detail="Database not configured")

    rows = await store._request(
        "GET",
        "applications",
        params={"id": f"eq.{app_id}", "org_id": f"eq.{org_id}"},
    )
    if not rows:
        raise HTTPException(status_code=404, detail="Application not found")

    app = rows[0]

    # Enrich with related data
    candidate_rows = await store._request("GET", "candidates", params={"id": f"eq.{app['candidate_id']}"})
    job_rows = await store._request("GET", "job_roles", params={"id": f"eq.{app['job_role_id']}"})
    session_rows = await store._request(
        "GET", "interview_sessions", params={"application_id": f"eq.{app_id}"}
    )
    scorecard_rows = await store._request(
        "GET", "scorecards", params={"application_id": f"eq.{app_id}"}
    )
    schedule_rows = await store._request(
        "GET", "interview_schedules", params={"application_id": f"eq.{app_id}"}
    )

    return {
        **app,
        "candidate": candidate_rows[0] if candidate_rows else None,
        "job": job_rows[0] if job_rows else None,
        "interview_session": session_rows[0] if session_rows else None,
        "scorecards": scorecard_rows or [],
        "schedules": schedule_rows or [],
    }


@router.post("/applications/{app_id}/transition")
async def transition_application(
    app_id: str, transition: ApplicationTransition, auth: AuthenticatedKey = Depends(require_scopes("applications", mode="write"))
):
    store = get_store()
    if not store:
        raise HTTPException(status_code=503, detail="Database not configured")

    # Get current application
    rows = await store._request(
        "GET", "applications", params={"id": f"eq.{app_id}", "org_id": f"eq.{auth.org_id}"}
    )
    if not rows:
        raise HTTPException(status_code=404, detail="Application not found")
    app = rows[0]

    # Validate transition (add your business logic here)
    valid_transitions = {
        "applied": ["shortlisted", "auto_rejected"],
        "shortlisted": ["interview_sent"],
        "interview_sent": ["interviewed", "interview_expired"],
        "interviewed": ["passed_ai", "rejected_ai"],
        "passed_ai": ["partner_review"],
        "partner_review": ["hired", "rejected_final"],
    }

    if transition.to_status not in valid_transitions.get(app["status"], []):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid transition from {app['status']} to {transition.to_status}",
        )

    # Update application
    await store._request(
        "PATCH",
        "applications",
        params={"id": f"eq.{app_id}", "org_id": f"eq.{auth.org_id}"},
        json={"status": transition.to_status},
    )

    # Log stage history
    await store._request(
        "POST",
        "application_stage_history",
        json={
            "id": str(uuid4()),
            "application_id": app_id,
            "from_status": app["status"],
            "to_status": transition.to_status,
            "reason": transition.reason,
            "created_at": datetime.now(timezone.utc).isoformat(),
        },
    )

    # Log activity
    await store._request(
        "POST",
        "activity_log",
        json={
            "id": str(uuid4()),
            "org_id": auth.org_id,
            "entity_type": "application",
            "entity_id": app_id,
            "action": "stage_transition",
            "metadata": {
                "from_status": app["status"],
                "to_status": transition.to_status,
                "reason": transition.reason,
            },
            "created_at": datetime.now(timezone.utc).isoformat(),
        },
    )

    return {"id": app_id, "status": transition.to_status}


# Candidates endpoints
@router.get("/candidates")
async def list_candidates(
    org_id: str = Depends(get_org_id),
    email: Optional[str] = Query(None),
    job_id: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
):
    store = get_store()
    if not store:
        raise HTTPException(status_code=503, detail="Database not configured")

    params = {"org_id": f"eq.{org_id}", "order": "created_at.desc", "limit": "50"}
    if email:
        params["email"] = f"ilike.*{email}*"

    rows = await store._request("GET", "candidates", params=params)
    return {"data": rows or []}


@router.get("/candidates/{candidate_id}")
async def get_candidate(candidate_id: str, org_id: str = Depends(get_org_id)):
    store = get_store()
    if not store:
        raise HTTPException(status_code=503, detail="Database not configured")

    rows = await store._request(
        "GET", "candidates", params={"id": f"eq.{candidate_id}", "org_id": f"eq.{org_id}"}
    )
    if not rows:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return rows[0]


# Scores endpoints
@router.get("/applications/{app_id}/score")
async def get_application_score(app_id: str, org_id: str = Depends(get_org_id)):
    store = get_store()
    if not store:
        raise HTTPException(status_code=503, detail="Database not configured")

    rows = await store._request(
        "GET",
        "interview_sessions",
        params={"application_id": f"eq.{app_id}", "select": "question_scores,overall_score,proctoring_summary"},
    )
    if not rows:
        raise HTTPException(status_code=404, detail="No interview session found")
    return rows[0]


# Stages endpoints
@router.get("/jobs/{job_id}/stages")
async def list_job_stages(job_id: str, org_id: str = Depends(get_org_id)):
    store = get_store()
    if not store:
        raise HTTPException(status_code=503, detail="Database not configured")

    rows = await store._request(
        "GET",
        "pipeline_stages",
        params={"job_role_id": f"eq.{job_id}", "order": "order_index.asc"},
    )
    return {"data": rows or []}


# Scorecards endpoints
@router.get("/applications/{app_id}/scorecards")
async def list_scorecards(app_id: str, org_id: str = Depends(get_org_id)):
    store = get_store()
    if not store:
        raise HTTPException(status_code=503, detail="Database not configured")

    rows = await store._request(
        "GET", "scorecards", params={"application_id": f"eq.{app_id}"}
    )
    return {"data": rows or []}


@router.post("/applications/{app_id}/scorecards")
async def create_scorecard(app_id: str, scorecard: ScorecardCreate, auth: AuthenticatedKey = Depends(require_scopes("scorecards", mode="write"))):
    store = get_store()
    if not store:
        raise HTTPException(status_code=503, detail="Database not configured")

    scorecard_id = f"scorecard-{uuid4().hex[:12]}"
    payload = {
        "id": f"scorecard-{uuid4().hex[:12]}",
        "application_id": app_id,
        "recommendation": scorecard.recommendation,
        "overall_score": scorecard.overall_score,
        "competencies": scorecard.competencies,
        "notes": scorecard.notes,
        "submitted_at": datetime.now(timezone.utc).isoformat(),
    }

    await store._request("POST", "scorecards", json=payload)
    return {"id": scorecard_id, **payload}


# Schedules endpoints
@router.get("/applications/{app_id}/schedules")
async def list_schedules(app_id: str, org_id: str = Depends(get_org_id)):
    store = get_store()
    if not store:
        raise HTTPException(status_code=503, detail="Database not configured")

    rows = await store._request(
        "GET", "interview_schedules", params={"application_id": f"eq.{app_id}"}
    )
    return {"data": rows or []}


@router.post("/applications/{app_id}/schedules")
async def create_schedule(app_id: str, schedule: ScheduleCreate, org_id: str = Depends(get_org_id)):
    store = get_store()
    if not store:
        raise HTTPException(status_code=503, detail="Database not configured")

    schedule_id = f"sched-{uuid4().hex[:12]}"
    payload = {
        "id": schedule_id,
        "application_id": app_id,
        "stage_id": schedule.stage_id,
        "starts_at": schedule.starts_at,
        "ends_at": schedule.ends_at,
        "location": schedule.location,
        "meeting_url": schedule.meeting_url,
        "attendee_ids": schedule.attendee_ids,
    }

    await store._request("POST", "interview_schedules", json=payload)
    return {"id": schedule_id, **payload}


# Offers endpoints
@router.get("/applications/{app_id}/offer")
async def get_offer(app_id: str, org_id: str = Depends(get_org_id)):
    store = get_store()
    if not store:
        raise HTTPException(status_code=503, detail="Database not configured")

    rows = await store._request(
        "GET", "offers", params={"application_id": f"eq.{app_id}"}
    )
    if not rows:
        raise HTTPException(status_code=404, detail="Offer not found")
    return rows[0]


@router.post("/applications/{app_id}/offer")
async def create_offer(app_id: str, offer_data: dict, org_id: str = Depends(get_org_id)):
    store = get_store()
    if not store:
        raise HTTPException(status_code=503, detail="Database not configured")

    offer_id = f"offer-{uuid4().hex[:12]}"
    payload = {
        "id": f"offer-{uuid4().hex[:12]}",
        "application_id": app_id,
        "status": "draft",
        **offer_data,
    }

    await store._request("POST", "offers", json=payload)
    return {"id": offer_id, **payload}


# Webhook subscriptions endpoints
@router.get("/webhooks")
async def list_webhooks(auth: AuthenticatedKey = Depends(require_scopes("webhooks", mode="read"))):
    store = get_store()
    if not store:
        raise HTTPException(status_code=503, detail="Database not configured")
    rows = await store.list_webhook_subscriptions(auth.org_id)
    return {"data": rows or []}


@router.post("/webhooks", status_code=201)
async def create_webhook(subscription: WebhookSubscriptionCreate, auth: AuthenticatedKey = Depends(require_scopes("webhooks", mode="write"))):
    store = get_store()
    if not store:
        raise HTTPException(status_code=503, detail="Database not configured")

    valid = {e.value for e in WebhookEventType}
    bad = [e for e in subscription.events if e not in valid]
    if bad:
        raise HTTPException(status_code=400, detail=f"Unknown events: {bad}")

    secret = f"whsec_{uuid4().hex}"
    sub_id = await store.create_webhook_subscription(
        org_id=auth.org_id,
        url=subscription.url,
        secret=secret,
        events=subscription.events,
        description=subscription.description,
    )
    return {"id": sub_id, "secret": secret, **subscription.model_dump()}


@router.get("/webhooks/{webhook_id}")
async def get_webhook(webhook_id: str, auth: AuthenticatedKey = Depends(require_scopes("webhooks", mode="read"))):
    store = get_store()
    if not store:
        raise HTTPException(status_code=503, detail="Database not configured")
    row = await store.get_webhook_subscription(webhook_id, auth.org_id)
    if not row:
        raise HTTPException(status_code=404, detail="Webhook not found")
    # Hide the raw secret; expose only a redacted preview.
    row = {**row, "secret": f"{row['secret'][:8]}…(hidden)"}
    return row


@router.patch("/webhooks/{webhook_id}")
async def update_webhook(webhook_id: str, updates: dict, auth: AuthenticatedKey = Depends(require_scopes("webhooks", mode="write"))):
    store = get_store()
    if not store:
        raise HTTPException(status_code=503, detail="Database not configured")

    allowed = {"url", "events", "active", "description"}
    patch = {k: v for k, v in (updates or {}).items() if k in allowed}
    if not patch:
        raise HTTPException(status_code=400, detail="No updatable fields provided")
    if "events" in patch:
        valid = {e.value for e in WebhookEventType}
        bad = [e for e in patch["events"] if e not in valid]
        if bad:
            raise HTTPException(status_code=400, detail=f"Unknown events: {bad}")

    await store.update_webhook_subscription(webhook_id, auth.org_id, patch)
    return {"success": True}


@router.post("/webhooks/{webhook_id}/rotate-secret")
async def rotate_webhook_secret(webhook_id: str, auth: AuthenticatedKey = Depends(require_scopes("webhooks", mode="admin"))):
    store = get_store()
    if not store:
        raise HTTPException(status_code=503, detail="Database not configured")
    sub = await store.get_webhook_subscription(webhook_id, auth.org_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Webhook not found")
    new_secret = f"whsec_{uuid4().hex}"
    await store.update_webhook_subscription(webhook_id, auth.org_id, {"secret": new_secret})
    return {"id": webhook_id, "secret": new_secret}


@router.get("/webhooks/{webhook_id}/deliveries")
async def list_webhook_deliveries(webhook_id: str, limit: int = Query(50, le=200), auth: AuthenticatedKey = Depends(require_scopes("webhooks", mode="read"))):
    store = get_store()
    if not store:
        raise HTTPException(status_code=503, detail="Database not configured")
    rows = await store.get_webhook_deliveries(webhook_id, auth.org_id, limit)
    return {"data": rows or []}


@router.delete("/webhooks/{webhook_id}")
async def delete_webhook(webhook_id: str, auth: AuthenticatedKey = Depends(require_scopes("webhooks", mode="admin"))):
    store = get_store()
    if not store:
        raise HTTPException(status_code=503, detail="Database not configured")
    await store.delete_webhook_subscription(webhook_id, auth.org_id)
    return {"success": True}


# API keys endpoints (scoped REST access)
@router.get("/api-keys")
async def list_api_keys(auth: AuthenticatedKey = Depends(require_scopes("api_keys", mode="read"))):
    store = get_store()
    if not store:
        raise HTTPException(status_code=503, detail="Database not configured")
    return {"data": await store.list_api_keys(auth.org_id)}


@router.post("/api-keys", status_code=201)
async def create_api_key_endpoint(
    body: dict,
    auth: AuthenticatedKey = Depends(require_scopes("api_keys", mode="admin")),
):
    store = get_store()
    if not store:
        raise HTTPException(status_code=503, detail="Database not configured")

    name = (body.get("name") or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="name is required")
    scopes = normalize_scopes(body.get("scopes") or [])
    if not scopes:
        raise HTTPException(status_code=400, detail="at least one scope (read/write/admin) is required")

    plaintext, prefix, key_hash = generate_key()
    expires_at = body.get("expires_at")
    kid = await store.create_api_key(
        org_id=auth.org_id,
        name=name,
        key_hash=key_hash,
        prefix=prefix,
        scopes=list(scopes),
        created_by=auth.key_id,
        expires_at=expires_at,
    )
    # plaintext returned exactly once
    return {"id": kid, "name": name, "prefix": prefix, "scopes": list(scopes), "api_key": plaintext, "expires_at": expires_at}


@router.delete("/api-keys/{key_id}")
async def revoke_api_key(key_id: str, auth: AuthenticatedKey = Depends(require_scopes("api_keys", mode="admin"))):
    store = get_store()
    if not store:
        raise HTTPException(status_code=503, detail="Database not configured")
    await store.update_api_key(key_id, auth.org_id, {"active": False})
    return {"success": True}


# Calendar sync endpoints
@router.get("/calendar/connections")
async def list_calendar(auth: AuthenticatedKey = Depends(require_scopes("calendar", mode="read"))):
    store = get_store()
    if not store:
        raise HTTPException(status_code=503, detail="Database not configured")
    rows = await store.list_calendar_connections(auth.org_id)
    return {"data": rows or []}


@router.delete("/calendar/connections/{conn_id}")
async def disconnect_calendar(conn_id: str, auth: AuthenticatedKey = Depends(require_scopes("calendar", mode="write"))):
    store = get_store()
    if not store:
        raise HTTPException(status_code=503, detail="Database not configured")
    await store.delete_calendar_connection(conn_id, auth.org_id)
    return {"success": True}


@router.get("/schedules/{schedule_id}/slots")
async def list_slots(schedule_id: str, auth: AuthenticatedKey = Depends(require_scopes("calendar", mode="read"))):
    store = get_store()
    if not store:
        raise HTTPException(status_code=503, detail="Database not configured")
    return {"data": await store.list_interview_slots(schedule_id, auth.org_id)}


@router.post("/schedules/{schedule_id}/slots")
async def create_slots(schedule_id: str, body: dict, auth: AuthenticatedKey = Depends(require_scopes("calendar", mode="write"))):
    store = get_store()
    if not store:
        raise HTTPException(status_code=503, detail="Database not configured")
    slots = body.get("slots") or []
    if not slots or not isinstance(slots, list):
        raise HTTPException(status_code=400, detail="slots[] required")
    prepared = []
    for s in slots:
        prepared.append({
            "schedule_id": schedule_id,
            "starts_at": s["starts_at"],
            "ends_at": s["ends_at"],
            "interviewer_ids": s.get("interviewer_ids", []),
            "max_candidates": int(s.get("max_candidates", 1)),
            "status": "available",
        })
    ids = await store.create_interview_slots(auth.org_id, prepared)
    return {"created": len(ids), "ids": ids}


@router.post("/slots/{slot_id}/book")
async def book_slot(slot_id: str, body: dict, auth: AuthenticatedKey = Depends(require_scopes("calendar", mode="write"))):
    store = get_store()
    if not store:
        raise HTTPException(status_code=503, detail="Database not configured")
    candidate_id = body.get("candidate_id")
    if not candidate_id:
        raise HTTPException(status_code=400, detail="candidate_id required")
    await store.book_interview_slot(slot_id, candidate_id)
    return {"success": True}


# Proctoring dashboard endpoints
@router.get("/proctoring/sessions")
async def list_proctoring(
    job_id: Optional[str] = Query(None),
    flagged_only: bool = Query(False),
    limit: int = Query(50, le=200),
    auth: AuthenticatedKey = Depends(require_scopes("proctoring", mode="read")),
):
    store = get_store()
    if not store:
        raise HTTPException(status_code=503, detail="Database not configured")
    rows = await store.get_proctoring_sessions(auth.org_id, job_id=job_id, flagged_only=flagged_only, limit=limit)
    return {"data": rows or []}


@router.post("/proctoring/sessions/{session_id}/override")
async def proctoring_override(session_id: str, body: dict, auth: AuthenticatedKey = Depends(require_scopes("proctoring", mode="write"))):
    store = get_store()
    if not store:
        raise HTTPException(status_code=503, detail="Database not configured")
    flagged = bool(body.get("flagged", False))
    note = (body.get("note") or "").strip()
    if not note:
        raise HTTPException(status_code=400, detail="note is required for audit trail")
    await store.set_proctoring_override(session_id, flagged=flagged, note=note, actor_id=auth.key_id)
    return {"success": True}


# Custom scoring rules endpoints
@router.get("/jobs/{job_id}/scoring-rules")
async def get_scoring_rules(job_id: str, auth: AuthenticatedKey = Depends(require_scopes("scoring", mode="read"))):
    store = get_store()
    if not store:
        raise HTTPException(status_code=503, detail="Database not configured")
    rows = await store._request("GET", "job_roles", params={"id": f"eq.{job_id}", "org_id": f"eq.{auth.org_id}", "select": "custom_scoring_rules"})
    if not rows:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"job_id": job_id, "custom_scoring_rules": rows[0].get("custom_scoring_rules") or {}}


@router.put("/jobs/{job_id}/scoring-rules")
async def put_scoring_rules(job_id: str, body: dict, auth: AuthenticatedKey = Depends(require_scopes("scoring", mode="write"))):
    store = get_store()
    if not store:
        raise HTTPException(status_code=503, detail="Database not configured")
    rules = body.get("custom_scoring_rules")
    if not isinstance(rules, dict):
        raise HTTPException(status_code=400, detail="custom_scoring_rules must be an object")
    await store._request(
        "PATCH", "job_roles",
        params={"id": f"eq.{job_id}", "org_id": f"eq.{auth.org_id}"},
        json={"custom_scoring_rules": rules}, prefer="return=minimal",
    )
    return {"job_id": job_id, "custom_scoring_rules": rules}


@router.post("/scoring/preview")
async def preview_scoring_prompt(body: dict, auth: AuthenticatedKey = Depends(require_scopes("scoring", mode="read"))):
    """Return the prompt that would be sent to the scoring model for given rules.

    Useful so admins can validate custom rules without running a full interview.
    """
    from interview.scoring import _build_prompt
    from interview.questions import Question

    custom_rules = body.get("custom_scoring_rules") or {}
    questions = [
        Question(
            id=q.get("id", f"q{i}"),
            section=q.get("section", "technical"),
            prompt_text=q.get("prompt_text", ""),
            ideal_answer_notes=q.get("ideal_answer_notes", ""),
            time_limit_seconds=int(q.get("time_limit_seconds", 90)),
        )
        for i, q in enumerate(body.get("questions", []))
    ]
    entries = []  # No transcript needed for a structural preview
    prompt = _build_prompt(questions, entries, custom_rules)
    return {"prompt": prompt}



@router.get("/exports")
async def list_exports(org_id: str = Depends(get_org_id)):
    store = get_store()
    if not store:
        raise HTTPException(status_code=503, detail="Database not configured")

    rows = await store._request("GET", "export_jobs", params={"org_id": f"eq.{org_id}"})
    return {"data": rows or []}


@router.post("/exports")
async def create_export(config: ExportConfigCreate, org_id: str = Depends(get_org_id)):
    store = get_store()
    if not store:
        raise HTTPException(status_code=503, detail="Database not configured")

    export_id = f"exp-{uuid4().hex[:12]}"
    payload = {
        "id": f"exp-{uuid4().hex[:12]}",
        "org_id": org_id,
        **config.model_dump(),
    }

    await store._request("POST", "export_jobs", json=payload)
    return {"id": export_id, **config.model_dump()}


# Health check
@router.get("/health")
async def health():
    return {"status": "ok", "service": "hireloop-api-v1"}