-- Atomic finalize_session RPC
-- Adds a secure RPC to atomically finalize an interview session's state

CREATE OR REPLACE FUNCTION public.finalize_session_rpc(
  p_session_id text,
  p_status text,
  p_ended_at timestamptz,
  p_total_duration_seconds int,
  p_transcript jsonb,
  p_current_index int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_status text;
  v_new_status text;
BEGIN
  -- Authenticated (non-service) callers must own the session's organization.
  IF auth.uid() IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.interview_sessions s
      JOIN public.applications a ON a.id = s.application_id
      JOIN public.job_roles j ON j.id = a.job_role_id
      WHERE s.id = p_session_id
        AND public.is_org_member(j.org_id, ARRAY['owner', 'admin', 'recruiter', 'hiring_manager', 'interviewer', 'coordinator'])
    ) THEN
      RAISE EXCEPTION 'not authorized to modify this interview session';
    END IF;
  END IF;

  -- Row-level locking to prevent races
  PERFORM 1 FROM public.interview_sessions WHERE id = p_session_id FOR UPDATE;

  SELECT status INTO v_existing_status FROM public.interview_sessions WHERE id = p_session_id;

  IF v_existing_status = 'flagged' THEN
    v_new_status := 'flagged';
  ELSE
    v_new_status := p_status;
  END IF;

  UPDATE public.interview_sessions
  SET
    status = v_new_status,
    ended_at = p_ended_at,
    total_duration_seconds = p_total_duration_seconds,
    transcript = COALESCE(p_transcript, '[]'::jsonb),
    current_question_index = p_current_index
  WHERE id = p_session_id;

END;
$$;

-- Restrict execution to the service_role; remove public execute
REVOKE EXECUTE ON FUNCTION public.finalize_session_rpc(text, text, timestamptz, int, jsonb, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.finalize_session_rpc(text, text, timestamptz, int, jsonb, int) TO service_role;
