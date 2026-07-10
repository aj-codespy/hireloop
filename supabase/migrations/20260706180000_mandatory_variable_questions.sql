-- Mandatory vs variable question pools + per-interview question count

alter table public.questions
  add column if not exists is_mandatory boolean not null default false;

alter table public.job_roles
  add column if not exists interview_question_count integer;

comment on column public.questions.is_mandatory is
  'When true, this question is always included in every interview for the job.';

comment on column public.job_roles.interview_question_count is
  'How many questions to ask per interview (mandatory + random variable). Null = ask all active questions.';

alter table public.interview_sessions
  add column if not exists question_ids jsonb;

comment on column public.interview_sessions.question_ids is
  'Ordered question ids selected for this session (mandatory + sampled variable).';
