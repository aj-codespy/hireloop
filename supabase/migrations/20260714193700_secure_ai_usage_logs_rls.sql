-- Drop the existing insecure SELECT policy on ai_usage_logs
DROP POLICY IF EXISTS "Admins can view AI usage logs" ON public.ai_usage_logs;

-- Recreate SELECT policy scoped to organization members who are admins (owner or admin)
CREATE POLICY "Admins can view AI usage logs" 
    ON public.ai_usage_logs 
    FOR SELECT 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 
            FROM public.interview_sessions s
            JOIN public.applications a ON a.id = s.application_id
            JOIN public.job_roles j ON j.id = a.job_role_id
            WHERE s.id = public.ai_usage_logs.session_id
              AND public.is_org_member(j.org_id, ARRAY['owner', 'admin'])
        )
    );
