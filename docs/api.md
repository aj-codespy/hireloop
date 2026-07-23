# HireLoop REST API v1

Auto-generated from `apps/api/routes/v1.py`. The REST API uses scoped API keys for authentication.

**Base URL:** `http://localhost:8000/v1` (dev) / `https://api.hireloop.com/v1` (prod)

---

## Authentication

All endpoints require an API key passed via the `X-API-Key` header.

### Create an API Key

```http
POST /v1/admin/api-keys
Content-Type: application/json
X-API-Key: <admin-key>

{
  "name": "Production Integration",
  "scopes": ["read", "write"],
  "resources": ["jobs", "applications", "candidates", "scores"],
  "expires_in_days": 365
}
```

Response (plaintext key shown only once):
```json
{
  "id": "key-abc123",
  "prefix": "hl_********",
  "plaintext": "hl_ABC123def456...",
  "scopes": ["read", "write"],
  "created_at": "2026-07-21T00:00:00Z"
}
```

### Scope System

| Scope | Access Level |
|-------|-------------|
| `read` | Read-only access to resources |
| `write` | Read + write (create, update, delete) |
| `admin` | Full access to all resources + key management |

Scopes are per-resource: a key with `jobs:read, candidates:write` can read jobs and fully manage candidates.

---

## Endpoints

### Jobs

| Method | Path | Description | Required Scope |
|--------|------|-------------|----------------|
| `GET` | `/v1/jobs` | List jobs (optional: `?status=live&department_id=X&limit=50`) | `jobs:read` |
| `POST` | `/v1/jobs` | Create a new job | `jobs:write` |
| `GET` | `/v1/jobs/{job_id}` | Get job details | `jobs:read` |
| `PATCH` | `/v1/jobs/{job_id}` | Update job (partial) | `jobs:write` |
| `DELETE` | `/v1/jobs/{job_id}` | Delete a job | `jobs:write` |

**Create Job Body:**
```json
{
  "title": "Software Engineer Intern",
  "description": "Summer 2026 internship...",
  "department_id": "dept-eng",
  "status": "draft",
  "eligibility_rules": [
    {"fieldKey": "cgpa", "operator": ">=", "value": "7.0", "label": "CGPA ≥ 7.0"}
  ],
  "passing_score": 7.0,
  "interview_question_count": 5,
  "form_fields": [
    {"key": "email", "type": "email", "label": "Email", "required": true}
  ]
}
```

### Applications

| Method | Path | Description | Required Scope |
|--------|------|-------------|----------------|
| `GET` | `/v1/applications` | List applications (optional: `?job_id=X&status=interviewed&limit=50`) | `applications:read` |
| `GET` | `/v1/applications/{app_id}` | Get application with enriched data (candidate, job, session, scores, schedules) | `applications:read` |
| `POST` | `/v1/applications/{app_id}/transition` | Transition application to a new status | `applications:write` |

**Transition Body:**
```json
{
  "to_status": "shortlisted",
  "reason": "Met eligibility threshold"
}
```

**Valid Transitions:**
| From | To |
|------|-----|
| `applied` | `shortlisted`, `auto_rejected` |
| `shortlisted` | `interview_sent` |
| `interview_sent` | `interviewed`, `interview_expired` |
| `interviewed` | `passed_ai`, `rejected_ai` |
| `passed_ai` | `partner_review` |
| `partner_review` | `hired`, `rejected_final` |

### Candidates

| Method | Path | Description | Required Scope |
|--------|------|-------------|----------------|
| `GET` | `/v1/candidates` | List candidates (optional: `?email=*john*&job_id=X&limit=50`) | `candidates:read` |
| `GET` | `/v1/candidates/{candidate_id}` | Get candidate details | `candidates:read` |

### Scores

| Method | Path | Description | Required Scope |
|--------|------|-------------|----------------|
| `GET` | `/v1/applications/{app_id}/score` | Get AI interview scores (per-question + overall + proctoring summary) | `scores:read` |

### Stages

| Method | Path | Description | Required Scope |
|--------|------|-------------|----------------|
| `GET` | `/v1/jobs/{job_id}/stages` | List pipeline stages for a job | `stages:read` |

### Scorecards (Human Evaluation)

| Method | Path | Description | Required Scope |
|--------|------|-------------|----------------|
| `GET` | `/v1/applications/{app_id}/scorecards` | List scorecards for an application | `scorecards:read` |
| `POST` | `/v1/applications/{app_id}/scorecards` | Submit a human scorecard | `scorecards:write` |

**Scorecard Body:**
```json
{
  "recommendation": "yes",
  "overall_score": 8.0,
  "competencies": [
    {"name": "Technical Skills", "score": 8, "notes": "Strong SQL knowledge"}
  ],
  "notes": "Solid candidate, would recommend for final round"
}
```

**Recommendation Values:** `strong_yes`, `yes`, `hold`, `no`, `strong_no`

### Schedules (Human Interview Rounds)

| Method | Path | Description | Required Scope |
|--------|------|-------------|----------------|
| `GET` | `/v1/applications/{app_id}/schedules` | List interview schedules | `schedules:read` |
| `POST` | `/v1/applications/{app_id}/schedules` | Create an interview schedule | `schedules:write` |

**Schedule Body:**
```json
{
  "stage_id": "stage-final",
  "starts_at": "2026-08-01T14:00:00Z",
  "ends_at": "2026-08-01T15:00:00Z",
  "location": "Conference Room A",
  "meeting_url": "https://meet.google.com/abc-defg-hij",
  "attendee_ids": ["user-1", "user-2"]
}
```

### Webhooks

| Method | Path | Description | Required Scope |
|--------|------|-------------|----------------|
| `GET` | `/v1/webhooks` | List webhook subscriptions | `webhooks:read` |
| `POST` | `/v1/webhooks` | Create a webhook subscription | `webhooks:write` |
| `GET` | `/v1/webhooks/{sub_id}` | Get subscription details | `webhooks:read` |
| `PATCH` | `/v1/webhooks/{sub_id}` | Update subscription | `webhooks:write` |
| `DELETE` | `/v1/webhooks/{sub_id}` | Delete subscription | `webhooks:write` |
| `GET` | `/v1/webhooks/{sub_id}/events` | List delivery events | `webhooks:read` |
| `POST` | `/v1/webhooks/{sub_id}/test` | Send test payload | `webhooks:write` |

**Webhook Subscription Body:**
```json
{
  "url": "https://api.example.com/hireloop-webhooks",
  "events": ["application.created", "score.available", "candidate.qualified"],
  "description": "Sync to internal ATS"
}
```

**Available Event Types:**
`application.created`, `interview.link_sent`, `interview.started`, `interview.completed`,
`interview.flagged`, `score.available`, `stage.changed`, `candidate.qualified`,
`scorecard.submitted`, `interview.scheduled`, `interview.rescheduled`, `offer.created`,
`offer.sent`, `offer.responded`, `candidate.hired`, `candidate.rejected`

**Delivery Format:**
```json
{
  "event_id": "evt-abc123",
  "event_type": "score.available",
  "version": "2026-07-18",
  "timestamp": "2026-07-21T12:00:00Z",
  "data": {
    "session_id": "sess-xyz",
    "application_id": "app-abc",
    "overall_score": 8.2,
    "passed": true,
    "question_scores": [...]
  }
}
```

Webhooks are delivered with HMAC-SHA256 signatures in the `X-HireLoop-Signature` header.
Verify using your subscription secret. Retry schedule: 1m, 5m, 15m, 1h, 6h, 24h (max 6 attempts, 72h total).

### Exports

| Method | Path | Description | Required Scope |
|--------|------|-------------|----------------|
| `GET` | `/v1/exports` | List export configurations | `exports:read` |
| `POST` | `/v1/exports` | Create export configuration | `exports:write` |
| `GET` | `/v1/exports/{config_id}` | Get config details | `exports:read` |
| `PATCH` | `/v1/exports/{config_id}` | Update config | `exports:write` |
| `DELETE` | `/v1/exports/{config_id}` | Delete config | `exports:write` |
| `POST` | `/v1/exports/{config_id}/run` | Trigger manual export run | `exports:write` |
| `GET` | `/v1/exports/{config_id}/jobs` | List export job history | `exports:read` |

**Export Config Body:**
```json
{
  "name": "Weekly Candidate Export",
  "type": "candidates",
  "schedule": {"frequency": "weekly", "timezone": "UTC", "day_of_week": 1, "hour": 9},
  "format": "csv",
  "destination": {
    "type": "s3",
    "bucket": "hireloop-exports",
    "prefix": "weekly/",
    "region": "us-east-1"
  },
  "field_mapping": {"email": "candidate_email", "name": "full_name"}
}
```

**Supported Formats:** `csv`, `json`, `parquet` (requires `pyarrow`)

**Supported Destinations:** `s3` (requires `boto3`), `sftp` (requires `asyncssh`), `email` (requires `aiosmtplib`), `google_sheets` (requires `gspread` + `google-auth`)

---

## Error Responses

| Code | Meaning |
|------|---------|
| `401` | Missing or invalid API key |
| `403` | API key lacks required scope |
| `404` | Resource not found |
| `400` | Invalid request body or transition |
| `503` | Database not configured |

---

## Rate Limits

| Tier | Limit |
|------|-------|
| Default | 60 req/min per endpoint |
| `interview/answers/chunk` | 100 req/min |
| `admin/questions/render-audio` | 10 req/min |

Rate limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## API Versioning

Current version: `v1` — URL-prefix versioning (`/v1/...`). The API version is also available via the `/health` endpoint.

Future versions will be added as `/v2/...` with documented migration paths.

---

*Generated from `apps/api/routes/v1.py` | Last updated: 2026-07-21*