CREATE TABLE public.job_rounds (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  job_role_id text NOT NULL REFERENCES public.job_roles (id) ON DELETE CASCADE,
  title text NOT NULL,
  order_index integer NOT NULL,
  passing_score numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX job_rounds_job_role_id_idx ON public.job_rounds (job_role_id);

ALTER TABLE public.job_rounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_live_job_rounds" ON public.job_rounds FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.job_roles j
    WHERE j.id = job_rounds.job_role_id AND j.status = 'live'
  )
);

CREATE POLICY "authenticated_all_job_rounds" ON public.job_rounds FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.questions ADD COLUMN round_id text REFERENCES public.job_rounds(id) ON DELETE CASCADE;
ALTER TABLE public.applications ADD COLUMN current_round_id text REFERENCES public.job_rounds(id);
ALTER TABLE public.interview_sessions ADD COLUMN round_id text REFERENCES public.job_rounds(id);

DO $$
DECLARE
    job RECORD;
    new_round_id text;
BEGIN
    FOR job IN SELECT id, passing_score FROM public.job_roles LOOP
        new_round_id := gen_random_uuid()::text;
        
        INSERT INTO public.job_rounds (id, job_role_id, title, order_index, passing_score)
        VALUES (new_round_id, job.id, 'Round 1', 0, job.passing_score);
        
        UPDATE public.questions SET round_id = new_round_id WHERE job_role_id = job.id;
        
        UPDATE public.applications SET current_round_id = new_round_id WHERE job_role_id = job.id;
        
        UPDATE public.interview_sessions s
        SET round_id = new_round_id
        FROM public.applications a
        WHERE s.application_id = a.id AND a.job_role_id = job.id;
    END LOOP;
END $$;
