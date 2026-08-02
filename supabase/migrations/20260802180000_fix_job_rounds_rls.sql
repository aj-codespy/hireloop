-- Fix RLS hole on job_rounds: the multi-round migration granted
-- FOR ALL TO authenticated USING (true) WITH CHECK (true), letting any
-- signed-in user read/modify/delete any org's rounds.
-- Scope to org membership (same pattern as public.questions).

drop policy if exists "authenticated_all_job_rounds" on public.job_rounds;

-- Org members can read rounds for jobs in their org.
create policy "org_members_read_job_rounds"
  on public.job_rounds for select
  to authenticated
  using (public.is_org_member(public.job_org_id(job_role_id)));

-- Owners/admins manage rounds for jobs in their org.
create policy "org_managers_manage_job_rounds"
  on public.job_rounds for all
  to authenticated
  using (
    public.is_org_member(public.job_org_id(job_role_id), array['owner', 'admin'])
  )
  with check (
    public.is_org_member(public.job_org_id(job_role_id), array['owner', 'admin'])
  );
