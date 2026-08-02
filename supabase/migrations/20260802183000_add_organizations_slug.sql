-- Add organizations.slug for fresh environments.
-- Prod was repaired manually (Phase 0, 2026-07); this migration closes the
-- drift so new envs (staging/CI) match prod. Idempotent: no-op if present.
-- No unique index: code only writes slug on org creation (multi-step-auth.ts);
-- nothing queries by slug yet, and prod has no index either.

alter table public.organizations
  add column if not exists slug text;
