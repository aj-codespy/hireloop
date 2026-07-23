# Progress Log

Last visited: 2026-07-15T10:12:34+05:30

- [ ] Run `python3 test_postgres_conn.py` to identify connectivity parameters.
- [ ] Adapt migration script with working params and apply migrations.
- [ ] Verify migration success (RPC functions, status constraint, RLS policy).
- [ ] Run concurrency verification (`python3 scripts/verify_proctoring_concurrency.py`).
- [ ] Run E2E tests (`PYTHONPATH=apps/api python3 scripts/test_interview_e2e.py`).
- [ ] Run persistence tests (`node --env-file=apps/web/.env.local apps/web/scripts/test-interview-persistence.mjs`).
- [ ] Run production build and lint in `apps/web/`.
- [ ] Write handoff report (`handoff.md`).
