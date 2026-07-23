-- HireLoop V1 Database Migrations
-- Run these against production Supabase after the 4 pending migrations

-- ============================================================
-- 1. V1 Schema Additions (run after pending migrations)
-- ============================================================

-- 1.1 Proctoring v2: cheating probability column
ALTER TABLE public.interview_sessions
  ADD COLUMN IF NOT EXISTS cheating_probability INTEGER DEFAULT 0 CHECK (cheating_probability >= 0 AND cheating_probability <= 100),
  ADD COLUMN IF NOT EXISTS proctoring_ended_interview BOOLEAN DEFAULT FALSE;

-- 1.2 Custom scoring rules per job
ALTER TABLE public.job_roles
  ADD COLUMN IF NOT EXISTS custom_scoring_rules JSONB DEFAULT '{}'::jsonb;

-- 1.3 Webhook events table
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'failed', 'dead_letter')),
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,
  response_code INTEGER,
  response_body TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS webhook_events_org_id_idx ON public.webhook_events(org_id);
CREATE INDEX IF NOT EXISTS webhook_events_status_next_retry_idx ON public.webhook_events(status, next_retry_at) WHERE status IN ('pending', 'failed');
CREATE INDEX IF NOT EXISTS webhook_events_created_at_idx ON public.webhook_events(created_at DESC);

-- 1.4 Webhook subscriptions
CREATE TABLE IF NOT EXISTS public.webhook_subscriptions (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  secret TEXT NOT NULL,
  events TEXT[] NOT NULL,
  version TEXT DEFAULT '2026-07-18',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS webhook_subscriptions_org_id_idx ON public.webhook_subscriptions(org_id);
CREATE INDEX IF NOT EXISTS webhook_subscriptions_active_idx ON public.webhook_subscriptions(active) WHERE active;

-- 1.4.5 API Keys for REST API access
CREATE TABLE IF NOT EXISTS public.api_keys (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,  -- bcrypt hash of the key
  prefix TEXT NOT NULL,    -- First 8 chars for display
  scopes TEXT[] NOT NULL DEFAULT '{}',
  active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id)
);

CREATE INDEX IF NOT EXISTS api_keys_org_id_idx ON public.api_keys(org_id);
CREATE INDEX IF NOT EXISTS api_keys_active_idx ON public.api_keys(active) WHERE active;
CREATE INDEX IF NOT EXISTS api_keys_key_hash_idx ON public.api_keys(key_hash);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_admins_read_api_keys" ON public.api_keys FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, ARRAY['owner', 'admin']));
CREATE POLICY "org_admins_manage_api_keys" ON public.api_keys FOR ALL TO authenticated
  USING (public.is_org_member(org_id, ARRAY['owner', 'admin']))
  WITH CHECK (public.is_org_member(org_id, ARRAY['owner', 'admin']));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_keys TO service_role;

-- 1.5 Scheduled exports
CREATE TABLE IF NOT EXISTS public.export_jobs (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('applications', 'candidates', 'scores', 'pipeline', 'compliance')),
  schedule JSONB NOT NULL, -- {frequency, timezone, hour, day_of_week, day_of_month}
  format TEXT NOT NULL DEFAULT 'csv' CHECK (format IN ('csv', 'json', 'parquet')),
  destination JSONB NOT NULL, -- {type, bucket, prefix, credentials_ref}
  filters JSONB,
  field_mapping JSONB,
  active BOOLEAN DEFAULT TRUE,
  last_run_at TIMESTAMPTZ,
  last_status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS export_jobs_org_id_idx ON public.export_jobs(org_id);
CREATE INDEX IF NOT EXISTS export_jobs_active_idx ON public.export_jobs(active) WHERE active;

-- 1.6 Calendar connections
CREATE TABLE IF NOT EXISTS public.calendar_connections (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'outlook')),
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  calendars JSONB, -- selected calendar IDs
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS calendar_connections_org_id_idx ON public.calendar_connections(org_id);
CREATE INDEX IF NOT EXISTS calendar_connections_user_id_idx ON public.calendar_connections(user_id);

-- 1.7 Interview slots for self-scheduling
CREATE TABLE IF NOT EXISTS public.interview_slots (
  id TEXT PRIMARY KEY,
  schedule_id TEXT REFERENCES public.interview_schedules(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  interviewer_ids UUID[] NOT NULL,
  max_candidates INTEGER DEFAULT 1,
  booked_by UUID REFERENCES public.profiles(id),
  booked_at TIMESTAMPTZ,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'booked', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS interview_slots_schedule_id_idx ON public.interview_slots(schedule_id);
CREATE INDEX IF NOT EXISTS interview_slots_starts_at_idx ON public.interview_slots(starts_at);
CREATE INDEX IF NOT EXISTS interview_slots_status_idx ON public.interview_slots(status) WHERE status = 'available';

-- ============================================================
-- 2. RLS Policies for New Tables
-- ============================================================

-- webhook_events
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_members_read_webhook_events" ON public.webhook_events FOR SELECT TO authenticated
  USING (public.is_org_member(org_id));
CREATE POLICY "org_admins_manage_webhook_events" ON public.webhook_events FOR ALL TO authenticated
  USING (public.is_org_member(org_id, ARRAY['owner', 'admin']))
  WITH CHECK (public.is_org_member(org_id, ARRAY['owner', 'admin']));

-- webhook_subscriptions
ALTER TABLE public.webhook_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_admins_read_webhook_subs" ON public.webhook_subscriptions FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, ARRAY['owner', 'admin']));
CREATE POLICY "org_admins_manage_webhook_subs" ON public.webhook_subscriptions FOR ALL TO authenticated
  USING (public.is_org_member(org_id, ARRAY['owner', 'admin']))
  WITH CHECK (public.is_org_member(org_id, ARRAY['owner', 'admin']));

-- export_jobs
ALTER TABLE public.export_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_members_read_exports" ON public.export_jobs FOR SELECT TO authenticated
  USING (public.is_org_member(org_id));
CREATE POLICY "org_admins_manage_exports" ON public.export_jobs FOR ALL TO authenticated
  USING (public.is_org_member(org_id, ARRAY['owner', 'admin']))
  WITH CHECK (public.is_org_member(org_id, ARRAY['owner', 'admin']));

-- calendar_connections
ALTER TABLE public.calendar_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_calendars" ON public.calendar_connections FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "org_admins_read_calendars" ON public.calendar_connections FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, ARRAY['owner', 'admin']));

-- interview_slots
ALTER TABLE public.interview_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_members_read_slots" ON public.interview_slots FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.interview_schedules s
      JOIN public.applications a ON a.id = s.application_id
      JOIN public.job_roles j ON j.id = a.job_role_id
      WHERE s.id = interview_slots.schedule_id
        AND public.is_org_member(j.org_id)
    )
  );
CREATE POLICY "org_pipeline_manage_slots" ON public.interview_slots FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.interview_schedules s
      JOIN public.applications a ON a.id = s.application_id
      JOIN public.job_roles j ON j.id = a.job_role_id
      WHERE s.id = interview_slots.schedule_id
        AND public.is_org_member(j.org_id, ARRAY['owner', 'admin', 'recruiter', 'coordinator'])
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.interview_schedules s
      JOIN public.applications a ON a.id = s.application_id
      JOIN public.job_roles j ON j.id = a.job_role_id
      WHERE s.id = interview_slots.schedule_id
        AND public.is_org_member(j.org_id, ARRAY['owner', 'admin', 'recruiter', 'coordinator'])
    )
  );

-- ============================================================
-- 3. Function for Cheating Probability Calculation
-- ============================================================

CREATE OR REPLACE FUNCTION public.calculate_cheating_probability(
  p_session_id TEXT
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log JSONB;
  v_summary JSONB;
  v_score INTEGER := 0;
  v_event JSONB;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  -- Get proctoring log and summary
  SELECT proctoring_log, proctoring_summary
  INTO v_log, v_summary
  FROM public.interview_sessions
  WHERE id = p_session_id;

  IF v_log IS NULL THEN
    RETURN 0;
  END IF;

  -- Process each event with time decay
  FOR v_event IN SELECT * FROM jsonb_array_elements(v_log)
  LOOP
    DECLARE
      v_severity TEXT := v_event->>'severity';
      v_timestamp TIMESTAMPTZ := (v_event->>'at')::TIMESTAMPTZ;
      v_hours_old NUMERIC := EXTRACT(EPOCH FROM (v_now - v_timestamp)) / 3600;
      v_weight NUMERIC := GREATEST(0.3, 1 - v_hours_old / 24);
    BEGIN
      IF v_severity = 'critical' THEN
        v_score := v_score + (25 * v_weight);
      ELSIF v_severity = 'warning' THEN
        v_score := v_score + (10 * v_weight);
      END IF;
    END;
  END LOOP;

  -- Add AI snapshot analysis from summary
  IF v_summary IS NOT NULL THEN
    v_score := v_score + COALESCE((v_summary->>'warnings')::INTEGER, 0) * 5;
    v_score := v_score + COALESCE((v_summary->>'critical')::INTEGER, 0) * 15;
  END IF;

  RETURN LEAST(100, GREATEST(0, v_score::INTEGER));
END;
$$;

-- Grant execute to service_role only
REVOKE EXECUTE ON FUNCTION public.calculate_cheating_probability(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.calculate_cheating_probability(TEXT) TO service_role;

-- ============================================================
-- 4. Candidate Qualified Webhook Trigger Helper
-- ============================================================

-- Function to be called from backend when candidate reaches qualified stage
-- This is a helper; actual webhook dispatch happens in backend
CREATE OR REPLACE FUNCTION public.dispatch_candidate_qualified_webhook(
  p_application_id TEXT,
  p_candidate_id TEXT,
  p_job_id TEXT,
  p_ai_score NUMERIC,
  p_human_scorecards JSONB,
  p_proctoring_flagged BOOLEAN,
  p_cheating_probability INTEGER,
  p_qualified_at TIMESTAMPTZ DEFAULT NOW()
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id TEXT;
  v_webhook_payload JSONB;
BEGIN
  -- Get org_id from job
  SELECT org_id INTO v_org_id FROM public.job_roles WHERE id = p_job_id;
  
  IF v_org_id IS NULL THEN
    RETURN;
  END IF;

  -- Build payload
  v_webhook_payload := jsonb_build_object(
    'application_id', p_application_id,
    'candidate_id', p_candidate_id,
    'job_id', p_job_id,
    'ai_score', p_ai_score,
    'human_scorecards', p_human_scorecards,
    'proctoring_flagged', p_proctoring_flagged,
    'cheating_probability', p_cheating_probability,
    'qualified_at', p_qualified_at
  );

  -- Log the webhook event (backend will dispatch)
  INSERT INTO public.webhook_events (id, org_id, event_type, payload, status, created_at)
  VALUES (gen_random_uuid()::TEXT, v_org_id, 'candidate.qualified', v_webhook_payload, 'pending', NOW())
  ON CONFLICT DO NOTHING;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.dispatch_candidate_qualified_webhook(TEXT, TEXT, TEXT, NUMERIC, JSONB, BOOLEAN, INTEGER, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.dispatch_candidate_qualified_webhook(TEXT, TEXT, TEXT, NUMERIC, JSONB, BOOLEAN, INTEGER, TIMESTAMPTZ) TO service_role;

-- ============================================================
-- 5. Update Applications Status Check (add new statuses if needed)
-- ============================================================

-- Note: The existing CHECK constraint in 20260714193600 covers current statuses.
-- For V1, we may need 'qualified' as a new status between 'partner_review' and 'hired'
-- Uncomment when ready:
-- ALTER TABLE public.applications DROP CONSTRAINT IF EXISTS applications_status_check;
-- ALTER TABLE public.applications ADD CONSTRAINT applications_status_check
--   CHECK (status IN (
--     'applied', 'auto_rejected', 'shortlisted', 'interview_sent', 'interviewed',
--     'interview_expired', 'passed_ai', 'rejected_ai', 'partner_review', 'qualified',
--     'hired', 'rejected_final'
--   ));

-- ============================================================
-- 6. Grant Permissions
-- ============================================================

GRANT SELECT, INSERT, UPDATE ON public.webhook_events TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.webhook_subscriptions TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.export_jobs TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.calendar_connections TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.interview_slots TO service_role;

-- ============================================================
-- 7. Updated Proctoring RPCs for V1 (No Auto-End)
-- ============================================================

-- The secure proctoring RPCs from 20260715120000_secure_proctoring_rpcs.sql
-- already handle authorization. For V1, we ensure they NEVER auto-end interviews.
-- The backend (structured_relay.py) must be updated to:
-- 1. Call calculate_cheating_probability() after each event
-- 2. Store probability in interview_sessions.cheating_probability
-- 3. NEVER call flag_session_proctoring_rpc() based on probability
-- 4. Only flag on explicit critical violations (phone detected, unauthorized person)
-- 5. Frontend shows probability badge, not "flagged" status

-- ============================================================
-- End of V1 Migrations
-- ============================================================