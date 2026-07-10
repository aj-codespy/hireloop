-- HireLoop initial schema
-- Run via Supabase Dashboard SQL editor or: supabase db push

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.organizations (
  id text primary key,
  name text not null,
  logo_url text,
  primary_color text not null default '#FF6B00',
  intro_video_url text,
  created_at timestamptz not null default now()
);

create table public.job_roles (
  id text primary key,
  org_id text not null references public.organizations (id) on delete cascade,
  title text not null,
  description text not null default '',
  status text not null check (status in ('draft', 'live', 'closed')),
  eligibility_rules jsonb not null default '[]'::jsonb,
  passing_score numeric,
  form_fields jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index job_roles_org_id_idx on public.job_roles (org_id);
create index job_roles_status_idx on public.job_roles (status);

create table public.questions (
  id text primary key,
  question_bank_id text not null,
  job_role_id text not null references public.job_roles (id) on delete cascade,
  section text not null check (section in ('technical', 'hr', 'situational')),
  prompt_text text not null,
  ideal_answer_notes text not null default '',
  time_limit_seconds integer,
  score_threshold numeric,
  order_index integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index questions_job_role_id_idx on public.questions (job_role_id);

create table public.candidates (
  id text primary key,
  org_id text not null references public.organizations (id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  resume_url text,
  source text not null default 'website',
  created_at timestamptz not null default now()
);

create index candidates_org_id_idx on public.candidates (org_id);
create index candidates_email_idx on public.candidates (email);

create table public.applications (
  id text primary key,
  candidate_id text not null references public.candidates (id) on delete cascade,
  job_role_id text not null references public.job_roles (id) on delete cascade,
  form_response jsonb not null default '{}'::jsonb,
  status text not null,
  interview_token text unique,
  token_expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index applications_job_role_id_idx on public.applications (job_role_id);
create index applications_candidate_id_idx on public.applications (candidate_id);
create index applications_interview_token_idx on public.applications (interview_token);

create table public.interview_sessions (
  id text primary key,
  application_id text not null references public.applications (id) on delete cascade,
  started_at timestamptz,
  ended_at timestamptz,
  status text not null check (status in ('in_progress', 'completed', 'abandoned', 'flagged')),
  total_duration_seconds integer,
  question_scores jsonb,
  overall_score jsonb,
  created_at timestamptz not null default now()
);

create index interview_sessions_application_id_idx on public.interview_sessions (application_id);

-- ---------------------------------------------------------------------------
-- RLS (permissive bootstrap — tighten when Supabase Auth is wired)
-- ---------------------------------------------------------------------------

alter table public.organizations enable row level security;
alter table public.job_roles enable row level security;
alter table public.questions enable row level security;
alter table public.candidates enable row level security;
alter table public.applications enable row level security;
alter table public.interview_sessions enable row level security;

-- Public can read live jobs + their questions (apply flow)
create policy "public_read_live_jobs"
  on public.job_roles for select
  using (status = 'live');

create policy "public_read_live_job_questions"
  on public.questions for select
  using (
    exists (
      select 1 from public.job_roles j
      where j.id = questions.job_role_id and j.status = 'live'
    )
  );

create policy "public_read_orgs_for_live_jobs"
  on public.organizations for select
  using (
    exists (
      select 1 from public.job_roles j
      where j.org_id = organizations.id and j.status = 'live'
    )
  );

-- Public apply: insert candidate + application for live jobs only
create policy "public_insert_candidates"
  on public.candidates for insert
  with check (true);

create policy "public_insert_applications"
  on public.applications for insert
  with check (
    exists (
      select 1 from public.job_roles j
      where j.id = applications.job_role_id and j.status = 'live'
    )
  );

-- Authenticated users (future admin) — full access for now
create policy "authenticated_all_organizations"
  on public.organizations for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated_all_job_roles"
  on public.job_roles for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated_all_questions"
  on public.questions for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated_all_candidates"
  on public.candidates for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated_all_applications"
  on public.applications for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated_all_interview_sessions"
  on public.interview_sessions for all
  to authenticated
  using (true)
  with check (true);

-- Service role bypasses RLS; admin server actions use SUPABASE_SERVICE_ROLE_KEY.
