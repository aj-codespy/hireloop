# Integration & Export Specification

**Version:** 1.0  
**Status:** Design Specification  
**Scope:** Webhooks, REST API, Scheduled Exports, Pre-built ATS Connectors  
**Related:** INTERVIEW_LIFECYCLE_DECISION.md (boundary), PAAS_MULTITENANT_DESIGN.md (multi-org)

---

## 1. Integration Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         HIRELOOP INTEGRATION LAYER                             │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐    │
│   │  WEBHOOKS   │   │  REST API   │   │   GRAPHQL   │   │ SCHEDULED   │    │
│   │  (Push)     │   │  (Pull)     │   │  (Flexible) │   │  EXPORTS    │    │
│   │             │   │             │   │             │   │  (Batch)    │    │
│   │ • Real-time │   │ • CRUD      │   │ • Dashboard │   │ • CSV/JSON  │    │
│   │ • Event-    │   │ • Pagination│   │   embedding │   │ • S3/SFTP/  │    │
│   │   driven    │   │ • Filtering │   │ • Custom    │   │   Sheets    │    │
│   │ • Retry     │   │ • Webhook   │   │   reports   │   │ • Daily/    │    │
│   │   + DLQ     │   │   mgmt      │   │             │   │   Hourly    │    │
│   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘    │
│          │                 │                 │                 │           │
│          └─────────────────┼─────────────────┼─────────────────┘           │
│                            ▼                                               │
│                 ┌─────────────────────┐                                   │
│                 │  AUTHORIZATION      │                                   │
│                 │  • API Keys (scoped)│                                   │
│                 │  • OAuth 2.0 / OIDC │                                   │
│                 │  • HMAC Webhook Sig │                                   │
│                 └──────────┬──────────┘                                   │
│                            ▼                                               │
│                 ┌─────────────────────┐                                   │
│                 │  RATE LIMITING      │                                   │
│                 │  • Per-tier limits  │                                   │
│                 │  • Burst allowance  │                                   │
│                 └─────────────────────┘                                   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Webhook System (Primary Integration Mechanism)

### 2.1 Event Catalog

| Event | Trigger | Payload Key Fields | Tier Availability |
|-------|---------|-------------------|-------------------|
| `application.created` | Candidate submits application | `application_id`, `candidate_id`, `job_id`, `form_response`, `eligibility_passed` | All |
| `application.status_changed` | Admin moves candidate in pipeline | `application_id`, `from_status`, `to_status`, `actor_id`, `reason` | All |
| `interview.link_sent` | Interview token generated + emailed | `application_id`, `interview_url`, `expires_at`, `language` | All |
| `interview.started` | Candidate begins AI interview | `session_id`, `application_id`, `question_count` | All |
| `interview.completed` | AI interview finishes (any status) | `session_id`, `application_id`, `status`, `duration_seconds`, `questions_answered` | All |
| `interview.flagged` | Proctoring violation (critical threshold) | `session_id`, `application_id`, `reason`, `violation_count`, `snapshots[]` | All |
| `score.available` | LLM scoring complete | `session_id`, `application_id`, `overall_score`, `passed`, `question_scores[]`, `strengths`, `concerns` | All |
| `stage.changed` | Pipeline stage transition | `application_id`, `from_stage_id`, `to_stage_id`, `stage_type`, `actor_id` | Growth+ |
| `scorecard.submitted` | Human interviewer submits evaluation | `scorecard_id`, `application_id`, `reviewer_id`, `recommendation`, `overall_score`, `competencies[]` | Growth+ |
| `interview.scheduled` | Human interview scheduled | `schedule_id`, `application_id`, `starts_at`, `ends_at`, `attendees[]`, `meeting_url`, `stage_id` | Growth+ |
| `interview.rescheduled` | Schedule changed | `schedule_id`, `application_id`, `old_starts_at`, `new_starts_at`, `initiator` | Growth+ |
| `offer.created` | Offer drafted | `offer_id`, `application_id`, `status`, `compensation`, `start_date`, `expires_at` | Scale+ |
| `offer.sent` | Offer delivered to candidate | `offer_id`, `application_id`, `sent_at`, `delivery_method` | Scale+ |
| `offer.responded` | Candidate accepts/declines | `offer_id`, `application_id`, `response`, `responded_at` | Scale+ |
| `candidate.hired` | Final status = hired | `application_id`, `candidate_id`, `job_id`, `hired_at`, `offer_id` | Scale+ |
| `candidate.rejected` | Final rejection (any stage) | `application_id`, `candidate_id`, `job_id`, `rejected_at`, `stage`, `reason` | All |

### 2.2 Webhook Delivery Guarantees

| Property | Specification |
|----------|---------------|
| **Delivery Order** | Per-application FIFO (different applications may interleave) |
| **Retry Policy** | Exponential backoff: 1m, 5m, 15m, 1h, 6h, 24h (max 72h) |
| **Timeout** | 10 seconds per attempt |
| **Success Criteria** | HTTP 2xx within timeout |
| **Dead Letter Queue** | After 6 failures → stored for 30 days, viewable in dashboard, manual replay |
| **Idempotency** | Each event has unique `event_id` (UUID v7); consumers MUST deduplicate |
| **Signature** | `X-HireLoop-Signature: sha256=<hex>` computed over raw body + timestamp |
| **Timestamp Header** | `X-HireLoop-Timestamp: <unix_epoch_seconds>` (reject if >5min skew) |
| **Versioning** | `X-HireLoop-Version: 2026-07-01` (date-based); 12-month support per version |

### 2.3 Webhook Registration API

```typescript
// POST /api/v1/webhooks
interface RegisterWebhookRequest {
  url: string;                    // HTTPS only, no localhost in production
  events: string[];               // Subset of event catalog
  secret: string;                 // 32+ char, provided by customer (or we generate)
  description?: string;
  active: boolean;                // Default true
}

// Response
interface WebhookRegistration {
  id: string;                     // wh_abc123
  url: string;
  events: string[];
  secret: string;                 // Only returned ONCE on create
  description: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  delivery_stats: {
    total_sent: number;
    successful: number;
    failed: number;
    last_delivery_at: string | null;
  };
}

// GET /api/v1/webhooks - List with pagination
// PATCH /api/v1/webhooks/{id} - Update (url, events, active, description)
// DELETE /api/v1/webhooks/{id} - Delete
// POST /api/v1/webhooks/{id}/test - Send test event
// GET /api/v1/webhooks/{id}/deliveries - Recent delivery logs (paginated)
// POST /api/v1/webhooks/{id}/replay - Replay failed deliveries
```

### 2.4 Example Payload

```json
{
  "event_id": "evt_01K7X9Z2N3P4Q5R6S7T8V9W0X1",
  "event_type": "score.available",
  "version": "2026-07-01",
  "timestamp": "2026-07-17T10:30:45.123Z",
  "organization_id": "org_abc123",
  "data": {
    "session_id": "sess_xyz789",
    "application_id": "app_456def",
    "candidate_id": "cand_789ghi",
    "job_id": "job_012jkl",
    "overall_score": 8.2,
    "passed": true,
    "passing_threshold": 7.0,
    "question_scores": [
      {
        "question_id": "q_tech_001",
        "prompt_text": "Walk me through bank reconciliation...",
        "score": 8.5,
        "rationale": "Candidate demonstrated thorough understanding...",
        "red_flags": []
      }
    ],
    "strengths": "Strong technical fundamentals, clear communication...",
    "concerns": "Limited experience with international standards...",
    "generated_at": "2026-07-17T10:30:44.000Z",
    "interview_duration_seconds": 420
  }
}
```

---

## 3. REST API (Pull-Based Access)

### 3.1 Authentication

| Method | Use Case |
|--------|----------|
| **API Key** (Bearer) | Server-to-server; scoped permissions; rotatable |
| **OAuth 2.0 Client Credentials** | Partner integrations; short-lived access tokens |
| **OAuth 2.0 Authorization Code** | User-facing integrations (e.g., "Connect to HireLoop" button) |

**API Key Scopes:**
```
read:organizations
read:jobs
write:jobs
read:applications
write:applications
read:candidates
write:candidates
read:scores
read:stages
write:stages
read:offers
write:offers
read:scorecards
write:scorecards
read:schedules
write:schedules
manage:webhooks
read:exports
```

### 3.2 Base URL & Versioning
```
https://api.hireloop.com/v1/
```
Version in URL path. Header `Accept: application/json` required.

### 3.3 Core Resources

#### Jobs
```
GET    /v1/jobs                    # List (filter: status, department_id, stage)
GET    /v1/jobs/{id}               # Get with questions, form, pipeline
POST   /v1/jobs                    # Create (requires write:jobs)
PATCH  /v1/jobs/{id}               # Update
DELETE /v1/jobs/{id}               # Archive (soft delete)
GET    /v1/jobs/{id}/questions     # List questions
POST   /v1/jobs/{id}/questions     # Bulk upsert questions
POST   /v1/jobs/{id}/publish       # Status -> live
POST   /v1/jobs/{id}/close         # Status -> closed
```

#### Applications
```
GET    /v1/applications                    # List (filter: job_id, status, stage_id, date_range, candidate_email)
GET    /v1/applications/{id}               # Full detail (form_response, scores, stages, documents)
PATCH  /v1/applications/{id}               # Update status, current_stage_id
POST   /v1/applications/{id}/transition    # Move to stage (with reason, actor)
GET    /v1/applications/{id}/timeline      # Stage history + activity log
GET    /v1/applications/{id}/documents     # List uploaded files with signed URLs
GET    /v1/applications/{id}/score         # AI score detail
GET    /v1/applications/{id}/scorecards    # Human scorecards
GET    /v1/applications/{id}/schedules     # Interview schedules
GET    /v1/applications/{id}/offer         # Offer detail
```

#### Candidates
```
GET    /v1/candidates                    # List (filter: email, job_id, source)
GET    /v1/candidates/{id}               # Profile + all applications
GET    /v1/candidates/{id}/applications  # Applications across jobs
```

#### Pipeline Stages
```
GET    /v1/jobs/{job_id}/stages          # Ordered stages for a job
POST   /v1/jobs/{job_id}/stages          # Create stage
PATCH  /v1/stages/{id}                   # Update stage config
DELETE /v1/stages/{id}                   # Delete (if no applications)
POST   /v1/stages/{id}/reorder           # Bulk reorder
```

#### Scorecards
```
GET    /v1/applications/{id}/scorecards
POST   /v1/applications/{id}/scorecards  # Submit scorecard
GET    /v1/scorecards/{id}
```

#### Interview Schedules
```
GET    /v1/applications/{id}/schedules
POST   /v1/applications/{id}/schedules   # Create schedule
PATCH  /v1/schedules/{id}                # Update (reschedule, cancel)
POST   /v1/schedules/{id}/remind         # Send reminders
```

#### Offers
```
GET    /v1/applications/{id}/offer
POST   /v1/applications/{id}/offer       # Create draft
PATCH  /v1/offers/{id}                   # Update draft
POST   /v1/offers/{id}/approve           # Approve -> sent
POST   /v1/offers/{id}/send              # Send to candidate
POST   /v1/offers/{id}/withdraw          # Withdraw
```

#### Exports
```
POST   /v1/exports                       # Create export job
GET    /v1/exports                       # List export jobs
GET    /v1/exports/{id}                  # Status + download URL (when ready)
```

### 3.4 Pagination & Filtering Standard

```typescript
// Request
GET /v1/applications?job_id=job_123&status=interviewed&stage_id=stg_456&created_after=2026-01-01&limit=50&cursor=abc123

// Response
{
  "data": [...],
  "pagination": {
    "limit": 50,
    "cursor": "next_cursor_or_null",
    "has_more": true,
    "total_count": 1247  // Optional, expensive; only if ?include_total=true
  }
}

// Filter operators (prefix field)
// _eq, _neq, _gt, _gte, _lt, _lte, _in, _nin, _like, _ilike, _is_null, _is_not_null
// Examples: status_eq=interviewed, created_at_gte=2026-01-01, job_id_in=job_1,job_2
```

### 3.5 Rate Limits

| Tier | Requests/Minute | Burst | Concurrent Connections |
|------|-----------------|-------|------------------------|
| Starter | 60 | 10 | 5 |
| Growth | 300 | 50 | 20 |
| Scale | 1,000 | 200 | 50 |
| Custom | Negotiated | Negotiated | Negotiated |

Headers returned: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## 4. GraphQL API (Dashboard Embedding & Flexible Queries)

### 4.1 Endpoint
```
POST https://api.hireloop.com/v1/graphql
```

### 4.2 Schema Highlights

```graphql
type Query {
  # Organization-scoped (viewer's org)
  organization: Organization!
  jobs(filter: JobFilter, pagination: Pagination): JobConnection!
  job(id: ID!): Job
  applications(filter: ApplicationFilter, pagination: Pagination): ApplicationConnection!
  application(id: ID!): Application
  candidates(filter: CandidateFilter, pagination: Pagination): CandidateConnection!
  
  # For embedded dashboards
  dashboardMetrics(dateRange: DateRange!): DashboardMetrics!
  pipelineFunnel(jobId: ID, dateRange: DateRange): [FunnelStage!]!
  sourceBreakdown(jobId: ID, dateRange: DateRange): [SourceStat!]!
}

type Application {
  id: ID!
  candidate: Candidate!
  job: Job!
  status: ApplicationStatus!
  currentStage: PipelineStage
  formResponse: JSON!
  documents: [ApplicationDocument!]!
  aiScore: AIScore
  scorecards: [Scorecard!]!
  schedules: [InterviewSchedule!]!
  offer: Offer
  stageHistory: [StageTransition!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type AIScore {
  overallScore: Float!
  passed: Boolean!
  strengths: String!
  concerns: String!
  questionScores: [QuestionScore!]!
  generatedAt: DateTime!
}

type QuestionScore {
  questionId: ID!
  promptText: String!
  score: Float!
  rationale: String!
  redFlags: [String!]!
}
```

### 4.3 Use Cases
- Custom admin dashboards embedded in customer portals
- Single-query fetch of application + score + scorecards + schedule
- Real-time subscriptions for live pipeline updates (future)

---

## 5. Scheduled Exports (Batch/Async)

### 5.1 Export Types

| Export | Frequency | Format | Destination | Contents |
|--------|-----------|--------|-------------|----------|
| **Applications Snapshot** | Daily / Hourly | CSV, JSON, Parquet | S3, SFTP, GCS, Email, Google Sheets | All applications with scores, status, timestamps |
| **Candidate Directory** | Daily | CSV, JSON | S3, SFTP, Email | Candidate profiles + latest application |
| **Interview Scores** | Daily / On-demand | CSV, JSON | S3, SFTP, Email | Per-question scores + overall + rationale |
| **Pipeline Analytics** | Weekly | CSV, JSON | S3, Email | Funnel conversion, time-in-stage, source ROI |
| **Compliance Package** | Monthly / On-demand | ZIP (CSV + PDF) | S3, SFTP, Email | EEO data, audit logs, proctoring evidence, score rationale |
| **Custom Query Export** | On-demand | CSV, JSON | S3, Email | Customer-defined SQL-like query (approved templates) |

### 5.2 Export Configuration API

```typescript
// POST /v1/exports/config
interface ExportConfig {
  name: string;
  type: 'applications' | 'candidates' | 'scores' | 'pipeline' | 'compliance' | 'custom';
  schedule: {
    frequency: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'manual';
    timezone: string;           // IANA tz
    day_of_week?: number;       // 0-6 for weekly
    day_of_month?: number;      // 1-28 for monthly
    hour: number;               // 0-23
  };
  format: 'csv' | 'json' | 'parquet';
  destination: {
    type: 's3' | 'sftp' | 'gcs' | 'email' | 'google_sheets';
    // S3
    bucket?: string;
    prefix?: string;
    region?: string;
    // SFTP
    host?: string;
    username?: string;
    path?: string;
    // Email
    recipients?: string[];
    // Google Sheets
    spreadsheet_id?: string;
    sheet_name?: string;
    credentials_ref?: string;   // Stored encrypted
  };
  filters?: {
    job_ids?: string[];
    statuses?: string[];
    date_range?: { from: string; to: string };  // ISO dates
    departments?: string[];
  };
  field_mapping?: Record<string, string>;  // HireLoop field -> Output column
  include_headers: boolean;
  compression?: 'none' | 'gzip' | 'zip';
  encryption?: 'none' | 'pgp';             // PGP public key ref
  active: boolean;
}

// Response includes next_run_at, last_run_at, last_status
```

### 5.3 Export Job Lifecycle
```
PENDING → RUNNING → COMPLETED (with download_url, expires_at)
                → FAILED (error_message, retry_count)
                → CANCELLED
```

### 5.4 S3/SFTP Delivery Details
- **S3:** Multipart upload for >100MB; server-side encryption (AES-256); bucket policy allows HireLoop write only
- **SFTP:** Key-based auth (customer provides public key); chroot to export directory
- **Naming:** `{org_id}/{export_type}/{YYYY}/{MM}/{DD}/{export_name}_{timestamp}.{format}.gz`
- **Manifest:** `_MANIFEST.json` alongside each export with row count, checksum, schema version

---

## 6. Pre-built ATS Connectors (Phase 3)

### 6.1 Connector Architecture

```
┌─────────────┐     Webhook / Polling      ┌──────────────┐
│  HIRELOOP   │ ──────────────────────────▶ │   CONNECTOR  │
│   EVENTS    │  (score.available,         │  (Stateless, │
│             │   stage.changed,           │   Deployed   │
│             │   offer.accepted)          │   per ATS)   │
└─────────────┘                             └──────┬───────┘
                                                   │
                                                   ▼
                                          ┌────────────────┐
                                          │  ATS API       │
                                          │  (Greenhouse,  │
                                          │   Lever, etc.) │
                                          └────────────────┘
```

### 6.2 Field Mapping (Greenhouse Example)

| HireLoop Entity | Greenhouse Entity | Mapping Notes |
|-----------------|-------------------|---------------|
| `JobRole` | `Job` | Title, description, departments → custom fields |
| `Application` | `Candidate` + `Application` | Candidate upsert by email; application linked to job |
| `AIScore` | `Scorecard` (custom) | Custom scorecard type "HireLoop AI Screen" |
| `HumanScorecard` | `Scorecard` | Standard interview scorecard |
| `InterviewSchedule` | `ScheduledInterview` | Map attendees → interviewers; meeting_url → video_conference_url |
| `Offer` | `Offer` | Compensation breakdown → pay_period, annual_base, equity |
| `StageTransition` | `Application` status change | Map HireLoop stages → Greenhouse stages (configurable) |

### 6.3 Connector Configuration (Customer-Facing)

```yaml
# hireloop-connector-config.yaml
connector: greenhouse
auth:
  api_key: ${GREENHOUSE_API_KEY}  # Stored encrypted
mapping:
  stages:
    applied: "Application Received"
    shortlisted: "Screen"
    interview_sent: "Phone Screen"
    interviewed: "Technical Interview"
    passed_ai: "Hiring Manager Review"
    partner_review: "Final Interview"
    hired: "Hired"
    rejected_final: "Declined"
  custom_fields:
    ai_score: "HireLoop AI Score"
    ai_passed: "HireLoop AI Passed"
    proctoring_flagged: "HireLoop Proctoring Flagged"
sync:
  direction: bidirectional
  poll_interval_minutes: 15  # For inbound (Greenhouse → HireLoop)
  webhook_secret: ${GREENHOUSE_WEBHOOK_SECRET}
```

### 6.4 Supported ATS (Launch Priority)

| Priority | ATS | API Type | Webhook Support | Notes |
|----------|-----|----------|-----------------|-------|
| P0 | Greenhouse | REST + Webhooks | Excellent | Market leader for mid-market |
| P0 | Lever | REST + Webhooks | Excellent | Strong SMB/mid-market |
| P1 | Ashby | REST + Webhooks | Good | Growing fast, developer-friendly |
| P1 | Workday | SOAP/REST | Limited | Enterprise; complex auth |
| P2 | BambooHR | REST | Basic | HRIS-focused, ATS module |
| P2 | Teamtailor | REST + Webhooks | Good | European market |
| P2 | Recruitee | REST + Webhooks | Good | European market |
| P3 | Custom (Generic Webhook) | Customer-defined | N/A | Field mapping UI |

---

## 7. Security & Compliance

### 7.1 Data Protection
- **Encryption in Transit:** TLS 1.3 minimum for all API/webhook endpoints
- **Encryption at Rest:** AES-256 for export files, database, secrets
- **PII Handling:** Email, name, phone, resume — flagged in schema; excluded from analytics exports by default
- **Data Residency:** Per-org `data_region` setting (us-east-1, eu-west-1, ap-south-1); exports respect region

### 7.2 Access Control
- API keys scoped to organization + permissions
- Webhook secrets never logged; only shown once on creation
- Audit log of all API key creation, rotation, deletion
- Export configs require Admin/Owner role

### 7.3 Compliance Features
- **GDPR Art. 28 DPA:** Available for Scale+ tiers
- **SOC 2 Type II:** In progress (target Q4 2026)
- **Data Processing Addendum:** Standard, countersigned
- **Right to Erasure:** API `DELETE /v1/candidates/{id}` (cascades to applications, scores, documents)
- **Data Portability:** Export config type `compliance` generates full subject access package

---

## 8. Developer Experience

### 8.1 Documentation Portal
- OpenAPI 3.1 spec at `/v1/openapi.json`
- GraphQL introspection enabled
- Interactive API explorer (Scalar/Stoplight)
- Webhook testing UI (send test events, view payloads)

### 8.2 SDKs (Planned)
| Language | Timeline | Scope |
|----------|----------|-------|
| TypeScript/Node | Phase 2 | Full REST + Webhook verification |
| Python | Phase 2 | Full REST + Export client |
| Go | Phase 3 | REST only |

### 8.3 Sandbox Environment
- `https://api-sandbox.hireloop.com/v1/`
- Pre-seeded test org with sample jobs, candidates, scores
- API keys: `sk_test_...` (rate limited to 10 req/min)
- Webhook testing via ngrok/Cloudflare tunnel support

---

## 9. Monitoring & Observability (Customer-Facing)

### 9.1 Integration Health Dashboard
- Webhook success rate (24h, 7d, 30d)
- Average delivery latency (p50, p95, p99)
- Failed deliveries count + last error
- API request volume + error rate by endpoint
- Export job success/failure history

### 9.2 Alerting (Customer Configurable)
- Webhook failure rate > 5% for 1 hour → Email/Slack/PagerDuty
- Export job failed 2x in a row → Alert
- API error rate > 10% for 15 min → Alert

---

## 10. Implementation Phases

| Phase | Timeline | Deliverables |
|-------|----------|--------------|
| **Phase 1: Webhooks + REST Core** | Weeks 1-6 | Event catalog (14 events), webhook registration, HMAC verification, retry/DLQ, REST API for Jobs/Applications/Candidates/Scores, API keys |
| **Phase 2: GraphQL + Exports** | Weeks 5-10 | GraphQL schema, scheduled exports (S3/SFTP/Email), export configs, compliance package |
| **Phase 3: ATS Connectors** | Weeks 10-18 | Greenhouse, Lever, Ashby connectors; field mapping UI; bidirectional sync |
| **Phase 4: Advanced** | Weeks 18+ | OAuth 2.0, SCIM provisioning, custom webhook transforms, sandbox environment, SDKs |

---

## 11. Open Questions

| # | Question | Options | Recommendation |
|---|----------|---------|----------------|
| Q1 | **Webhook payload size limit** | 256 KB vs 1 MB vs configurable | 256 KB; large payloads (transcripts) → provide `download_url` in payload |
| Q2 | **REST API pagination default** | Cursor vs Offset | Cursor (stable, performant); offset for small datasets only |
| Q3 | **Export format default** | CSV vs JSON vs Parquet | CSV (universal); Parquet for analytics (opt-in) |
| Q4 | **Connector hosting** | HireLoop-managed vs Customer-deployed | HireLoop-managed (simpler); customer-deployed for air-gapped (Custom tier) |
| Q5 | **API versioning in webhook** | Header vs Payload field | Header `X-HireLoop-Version` + payload `version` field (both) |
| Q6 | **Partner revenue share** | Referral fee vs Revenue share vs None | 20% revenue share for certified connector partners |

---

*This spec defines the integration surface for Option B (AI Screening + Human Orchestration). Review with Engineering + Product + Security before implementation.*