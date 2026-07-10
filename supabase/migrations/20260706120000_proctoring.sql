-- Proctoring audit trail for interview sessions
alter table public.interview_sessions
  add column if not exists proctoring_log jsonb not null default '[]'::jsonb,
  add column if not exists proctoring_summary jsonb;

create index if not exists interview_sessions_flagged_idx
  on public.interview_sessions (status)
  where status = 'flagged';
