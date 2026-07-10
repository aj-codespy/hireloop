-- Tighten RLS: org-scoped access instead of global authenticated_all_* policies

-- Helper: check org membership (optional role filter)
create or replace function public.is_org_member(p_org_id text, p_roles text[] default null)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.user_id = auth.uid()
      and om.org_id = p_org_id
      and (p_roles is null or om.role = any(p_roles))
  );
$$;

-- Helper: org for a job role
create or replace function public.job_org_id(p_job_role_id text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select org_id from public.job_roles where id = p_job_role_id;
$$;

-- ---------------------------------------------------------------------------
-- Drop permissive bootstrap policies
-- ---------------------------------------------------------------------------
drop policy if exists "authenticated_all_questions" on public.questions;
drop policy if exists "authenticated_all_candidates" on public.candidates;
drop policy if exists "authenticated_all_applications" on public.applications;
drop policy if exists "authenticated_all_interview_sessions" on public.interview_sessions;

-- ---------------------------------------------------------------------------
-- Questions — org members read; owners/admins write
-- ---------------------------------------------------------------------------
create policy "org_members_read_questions"
  on public.questions for select
  to authenticated
  using (public.is_org_member(public.job_org_id(job_role_id)));

create policy "org_managers_manage_questions"
  on public.questions for all
  to authenticated
  using (
    public.is_org_member(public.job_org_id(job_role_id), array['owner', 'admin'])
  )
  with check (
    public.is_org_member(public.job_org_id(job_role_id), array['owner', 'admin'])
  );

-- ---------------------------------------------------------------------------
-- Candidates — org members read candidates who applied to their org
-- ---------------------------------------------------------------------------
create policy "org_members_read_candidates"
  on public.candidates for select
  to authenticated
  using (
    exists (
      select 1
      from public.applications a
      join public.job_roles j on j.id = a.job_role_id
      where a.candidate_id = candidates.id
        and public.is_org_member(j.org_id)
    )
  );

-- ---------------------------------------------------------------------------
-- Applications — org members read/write pipeline for their org's jobs
-- ---------------------------------------------------------------------------
create policy "org_members_read_applications"
  on public.applications for select
  to authenticated
  using (public.is_org_member(public.job_org_id(job_role_id)));

create policy "org_pipeline_update_applications"
  on public.applications for update
  to authenticated
  using (
    public.is_org_member(
      public.job_org_id(job_role_id),
      array['owner', 'admin', 'recruiter']
    )
  )
  with check (
    public.is_org_member(
      public.job_org_id(job_role_id),
      array['owner', 'admin', 'recruiter']
    )
  );

-- ---------------------------------------------------------------------------
-- Interview sessions — org members read sessions for their applications
-- ---------------------------------------------------------------------------
create policy "org_members_read_interview_sessions"
  on public.interview_sessions for select
  to authenticated
  using (
    exists (
      select 1
      from public.applications a
      where a.id = interview_sessions.application_id
        and public.is_org_member(public.job_org_id(a.job_role_id))
    )
  );

create policy "org_members_update_interview_sessions"
  on public.interview_sessions for update
  to authenticated
  using (
    exists (
      select 1
      from public.applications a
      where a.id = interview_sessions.application_id
        and public.is_org_member(public.job_org_id(a.job_role_id))
    )
  )
  with check (
    exists (
      select 1
      from public.applications a
      where a.id = interview_sessions.application_id
        and public.is_org_member(public.job_org_id(a.job_role_id))
    )
  );

-- ---------------------------------------------------------------------------
-- Organizations — owners/admins can update their org profile
-- ---------------------------------------------------------------------------
create policy "org_managers_update_organizations"
  on public.organizations for update
  to authenticated
  using (public.is_org_member(id, array['owner', 'admin']))
  with check (public.is_org_member(id, array['owner', 'admin']));

-- ---------------------------------------------------------------------------
-- Job roles — restrict writes to owners/admins (reads already org-scoped)
-- ---------------------------------------------------------------------------
drop policy if exists "org_admins_job_roles" on public.job_roles;

create policy "org_members_read_job_roles"
  on public.job_roles for select
  to authenticated
  using (public.is_org_member(org_id));

create policy "org_managers_manage_job_roles"
  on public.job_roles for insert
  to authenticated
  with check (public.is_org_member(org_id, array['owner', 'admin']));

create policy "org_managers_update_job_roles"
  on public.job_roles for update
  to authenticated
  using (public.is_org_member(org_id, array['owner', 'admin']))
  with check (public.is_org_member(org_id, array['owner', 'admin']));

create policy "org_managers_delete_job_roles"
  on public.job_roles for delete
  to authenticated
  using (public.is_org_member(org_id, array['owner', 'admin']));

-- ---------------------------------------------------------------------------
-- Storage: proctoring snapshots readable by org members via session path
-- Paths: {session_id}/{uuid}.jpg — verified at app layer; bucket stays private
-- ---------------------------------------------------------------------------
create policy "org_members_read_proctoring_snapshots"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'proctoring-snapshots'
    and exists (
      select 1
      from public.interview_sessions s
      join public.applications a on a.id = s.application_id
      join public.job_roles j on j.id = a.job_role_id
      where split_part(name, '/', 1) = s.id
        and public.is_org_member(j.org_id)
    )
  );
