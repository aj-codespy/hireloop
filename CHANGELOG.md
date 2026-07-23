# Changelog

All notable changes to HireLoop will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).

## [Unreleased]

### Added
- REST API v1 with scoped API key authentication (`apps/api/routes/v1.py`)
- Webhook framework: 16 event types, HMAC-SHA256 signing, retry with DLQ (`apps/api/interview/webhooks.py`)
- Calendar sync service: Google Calendar + Outlook OAuth, free/busy, slot management (`apps/api/interview/calendar.py`)
- Scheduled exports framework: CSV/JSON/Parquet, S3/SFTP/Email/Sheets destinations (`apps/api/interview/exports.py`)
- GitHub CI/CD: dependency review, API tests, web build/lint, smoke test workflows
- Dependabot configuration for npm + pip + GitHub Actions
- Pull request template with quality gates
- `docs/environment.md` — centralized environment variable reference

### Changed
- WebSocket token validation now occurs before connection accept (prevents resource exhaustion)
- CORS configured via `ALLOWED_ORIGINS` environment variable instead of hardcoded wildcard
- Rate limiting added to all public endpoints via slowapi

### Fixed
- AI usage logs RLS cross-tenant leak (migration `20260714193700_secure_ai_usage_logs_rls.sql`)
- Applications status CHECK constraint missing values (migration `20260714193600_add_applications_status_check.sql`)

## [0.3.0] — 2026-07-18

### Added
- Structured interview relay with full proctoring, scoring, and transcript
- Real-time proctoring: face detection (MediaPipe), AI snapshot analysis (Gemini Vision)
- Scoring engine: per-question scores (0–10), overall weighted score, strengths/concerns, red flags
- Job creation wizard (5-step: Details → Form → Questions → Rules → Publish)
- Pipeline kanban with drag-drop stage transitions
- Candidate detail view (7 tabs: Application, Documents, Job, Proctoring, Transcript, Scores, Scorecard)
- Bilingual support (EN/HI) for TTS, STT, and scoring
- Resend email integration for interview invites, status updates, expiry notifications

### Changed
- Proctoring policy: never end interview — flag with cheating probability score on dashboard

## [0.2.0] — 2026-07-08

### Added
- Enterprise workflow foundations: requisitions, pipeline stages, departments, offers, activity log
- Mandatory/variable question model with configurable per-interview question count
- Organization profile (name, logo, primary color, intro video)
- Row-level security (RLS) across all tables with `is_org_member()` helper

## [0.1.0] — 2026-07-04

### Added
- Initial schema: organizations, profiles, job_roles, candidates, applications, questions
- Interview sessions with transcript storage and proctoring snapshots
- Supabase storage buckets: question-audio, interview-answers, proctoring-snapshots, application-documents
- Auth profiles trigger: auto-create profile on Supabase auth signup
- Structured interview: WebSocket relay, TTS question delivery, chunked audio upload