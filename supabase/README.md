# Supabase setup for HireLoop

HireLoop can persist data to **Supabase Postgres** or fall back to **browser localStorage** when Supabase env vars are not configured.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a project.
2. In **Project Settings → API**, copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Publishable (anon) key → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - Secret key (`sb_secret_...`) → `SUPABASE_SECRET_KEY` (server-only)
   - Legacy projects: service role JWT → `SUPABASE_SERVICE_ROLE_KEY`

## 2. Apply the schema

**Option A — Dashboard SQL editor**

1. Open **SQL Editor** in Supabase.
2. Run `supabase/migrations/20260703120000_initial_schema.sql`
3. Run `supabase/migrations/20260703140000_auth_profiles.sql` (login profiles + org admins)
4. Optionally run `supabase/seed.sql` for demo data

**Option B — Supabase CLI**

```bash
# Install CLI: https://supabase.com/docs/guides/cli
supabase login
supabase link --project-ref your-project-ref
supabase db push
supabase db execute --file supabase/seed.sql
```

## 3. Configure the web app

```bash
cd apps/web
cp .env.example .env.local
# Fill in your Supabase keys
npm run dev
```

When `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SECRET_KEY` are set, the app:

- Loads jobs, candidates, and applications from Postgres on startup
- Saves creates/updates via server actions (service role)
- Shares data across browsers and users

Without those vars, behavior is unchanged (localStorage).

## Schema overview

| Table | Purpose |
|-------|---------|
| `organizations` | Tenant / company branding |
| `job_roles` | Jobs with form fields + eligibility rules (JSONB) |
| `questions` | Interview question bank per job |
| `candidates` | Applicant profiles |
| `applications` | Form responses, status, interview tokens |
| `interview_sessions` | Voice interview results + scores |

## Security notes

- RLS is enabled on all tables. Bootstrap policies allow public apply on live jobs.
- Admin mutations use `SUPABASE_SECRET_KEY` via server actions only.
- **Tighten RLS policies** once Supabase Auth is wired for `/admin` and `/partner`.
- Never put the service role key in `NEXT_PUBLIC_*` env vars.

## Verify

After setup, create a job in `/admin/jobs/new`, then open the app in another browser — the job should appear (proves Postgres persistence).
