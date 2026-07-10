-- Fix infinite recursion on organization_members RLS.
-- The old org_members_select_same_org policy queried organization_members
-- from within an organization_members policy, which Postgres rejects.

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

grant execute on function public.is_org_member(text, text[]) to authenticated;

-- ---------------------------------------------------------------------------
-- organization_members — never self-join in policies; use security definer fn
-- ---------------------------------------------------------------------------
drop policy if exists "org_members_select_same_org" on public.organization_members;

create policy "org_members_select_same_org"
  on public.organization_members for select
  to authenticated
  using (public.is_org_member(org_id, array['owner', 'admin']));

-- ---------------------------------------------------------------------------
-- profiles / organizations — avoid direct organization_members subqueries
-- ---------------------------------------------------------------------------
drop policy if exists "profiles_select_org_candidates" on public.profiles;

create policy "profiles_select_org_candidates"
  on public.profiles for select
  to authenticated
  using (
    exists (
      select 1
      from public.job_roles j
      join public.applications a on a.job_role_id = j.id
      join public.candidates c on c.id = a.candidate_id
      where c.profile_id = profiles.id
        and public.is_org_member(j.org_id)
    )
  );

drop policy if exists "org_admins_organizations" on public.organizations;

create policy "org_admins_organizations"
  on public.organizations for select
  to authenticated
  using (public.is_org_member(id));
