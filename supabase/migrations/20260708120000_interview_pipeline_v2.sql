-- Phase 2 + 3: durable interview state and pre-rendered question audio

alter table public.questions
  add column if not exists audio_url text,
  add column if not exists audio_url_hi text;

alter table public.interview_sessions
  add column if not exists question_started_at timestamptz,
  add column if not exists answer_chunks jsonb not null default '{}'::jsonb;

comment on column public.questions.audio_url is 'Pre-rendered English TTS audio URL (Supabase Storage)';
comment on column public.questions.audio_url_hi is 'Pre-rendered Hindi TTS audio URL';
comment on column public.interview_sessions.question_started_at is 'Server-authoritative start time for the current question timer';
comment on column public.interview_sessions.answer_chunks is 'Map of question_index -> {chunk_paths[], chunk_count, mime_type, finalized}';

-- Question audio (pre-rendered TTS, public read)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'question-audio',
  'question-audio',
  true,
  5242880,
  array['audio/wav', 'audio/mpeg', 'audio/webm', 'audio/ogg']
)
on conflict (id) do nothing;

-- Answer chunks (private, service-role only)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'interview-answers',
  'interview-answers',
  false,
  10485760,
  array['audio/webm', 'audio/wav', 'audio/mpeg', 'audio/ogg']
)
on conflict (id) do nothing;
