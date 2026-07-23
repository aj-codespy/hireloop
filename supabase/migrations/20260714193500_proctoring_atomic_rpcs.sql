-- Atomic appender for proctoring event logs with row-level locking
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
  -- Explicit row-level locking to prevent race conditions
  PERFORM 1 FROM public.interview_sessions WHERE id = p_session_id FOR UPDATE;

  UPDATE public.interview_sessions
  SET proctoring_log = COALESCE(proctoring_log, '[]'::jsonb) || p_new_event
  WHERE id = p_session_id;
END;
$$;

-- Atomic updates for flagging proctoring summary with row-level locks
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
