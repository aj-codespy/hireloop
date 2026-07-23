-- Restrict the proctoring atomic RPCs so they cannot be invoked by anonymous
-- or non-owning roles. The FastAPI service calls these with the service_role
-- key (auth.uid() is null), which keeps working. Authenticated callers must
-- prove ownership of the session's organization.

CREATE OR REPLACE FUNCTION public.append_proctoring_event_rpc(
  p_session_id text,
  p_new_event jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  -- Explicit row-level locking to prevent race conditions
  PERFORM 1 FROM public.interview_sessions WHERE id = p_session_id FOR UPDATE;

  UPDATE public.interview_sessions
  SET proctoring_log = COALESCE(proctoring_log, '[]'::jsonb) || p_new_event
  WHERE id = p_session_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.flag_session_proctoring_rpc(
  p_session_id text,
  p_new_reason text,
  p_warnings_count int,
  p_critical_count int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing jsonb;
  v_reasons jsonb;
  v_updated jsonb;
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

  -- Row-level locking to prevent race conditions during concurrent modifications
  SELECT proctoring_summary INTO v_existing
  FROM public.interview_sessions
  WHERE id = p_session_id
  FOR UPDATE;

  IF v_existing IS NULL THEN
    v_existing := '{}'::jsonb;
  END IF;

  v_reasons := COALESCE(v_existing->'reasons', '[]'::jsonb);

  IF p_new_reason IS NOT NULL AND NOT (v_reasons @> jsonb_build_array(p_new_reason)) THEN
    v_reasons := v_reasons || jsonb_build_array(p_new_reason);
  END IF;

  v_updated := v_existing || jsonb_build_object(
    'flagged', true,
    'reasons', v_reasons,
    'warnings', p_warnings_count,
    'critical', p_critical_count
  );

  UPDATE public.interview_sessions
  SET proctoring_summary = v_updated
  WHERE id = p_session_id;
END;
$$;

-- Remove public execute so anonymous/authenticated clients cannot call these
-- RPCs directly. The service_role key (used by the FastAPI backend) retains
-- execute privileges.
REVOKE EXECUTE ON FUNCTION public.append_proctoring_event_rpc(text, jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.flag_session_proctoring_rpc(text, text, int, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.append_proctoring_event_rpc(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.flag_session_proctoring_rpc(text, text, int, int) TO service_role;
