-- Structured interview: per-question progress, reconnect window, language
alter table public.interview_sessions
  add column if not exists current_question_index integer not null default 0,
  add column if not exists language text not null default 'en',
  add column if not exists reconnect_expires_at timestamptz;

create index if not exists interview_sessions_in_progress_idx
  on public.interview_sessions (application_id, status)
  where status = 'in_progress';
