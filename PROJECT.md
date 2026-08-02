# Project: HireLoop

AI-powered interview screening platform. Structured, proctored voice interviews with reviewable evidence; qualified candidates delivered to customer systems via webhook. System boundary: **AI screening + human orchestration → qualified candidate list → `candidate.qualified` webhook. Customer owns offer/onboarding.**

## Architecture

- **Frontend**: Next.js (`apps/web`) — TypeScript, React 19, Tailwind CSS. Supabase via server actions / client; FastAPI backend via REST + WebSocket.
- **Backend**: FastAPI Python (`apps/api`) — interview engine (session, STT, scoring, TTS, proctoring), v1 REST API (API-key auth), webhook dispatch, email (Brevo).
- **Database**: Supabase Postgres — `supabase/migrations`, `supabase/seed.sql`. Dual-mode store (Supabase ↔ localStorage fallback) in `apps/web/src/lib/store/`.
- **AI**: Google Gemini (question generation, scoring, STT, TTS).

## Docs

Product/scope/features/deployment: [`docs/`](./docs/) — start at [`docs/scope.md`](./docs/scope.md). Per-vertical feature inventory: [`docs/vertical-inventory/`](./docs/vertical-inventory/).

## Interface Contracts

- **Supabase / PostgreSQL**: `applications.status` CHECK constraint; `ai_usage_logs` RLS policies must prevent cross-tenant access via organization membership.
- **Backend Connection Pooling**: shared `httpx.AsyncClient` instance/pool in `apps/api` (no per-request client).
- **Proctoring Logs Updates**: concurrent updates to `proctoring_logs` must not overwrite each other — atomic updates / optimistic locking / transactions.
- **Transcription Saves**: stale index tracking when saving background transcription chunks must be fixed to avoid out-of-order corruption.
- **API errors**: v1 routes return clean JSON (401/403/503/429/500) — never raw stack traces (Phase 1, 2026-08-02).

## Status

- Audit (M1), backend/DB remediation (M2), frontend remediation (M3), verification (M4) — **DONE**.
- Hardening Phase 1 (error handling, 10 tasks) — **DONE** 2026-08-02. Phase 2 (feature inventory) / Phase 3 (docs) / Phase 4 (solidification) — in progress.
