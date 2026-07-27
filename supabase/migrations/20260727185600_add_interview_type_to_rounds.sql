-- Add interview_type to job_rounds
ALTER TABLE public.job_rounds ADD COLUMN interview_type text NOT NULL DEFAULT 'ai';
