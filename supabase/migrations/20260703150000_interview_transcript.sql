-- Full interview transcript storage (candidate + AI turns)
alter table public.interview_sessions
  add column if not exists transcript jsonb not null default '[]'::jsonb;

create index if not exists interview_sessions_status_idx on public.interview_sessions (status);
