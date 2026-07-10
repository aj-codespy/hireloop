-- Auth profiles + organization membership
-- Run after 20260703120000_initial_schema.sql

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  account_type text not null check (account_type in ('candidate', 'org_admin', 'partner')),
  email text not null,
  full_name text not null default '',
  phone text,
  resume_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_email_unique unique (email)
);

create index profiles_account_type_idx on public.profiles (account_type);
create index profiles_email_idx on public.profiles (email);

-- ---------------------------------------------------------------------------
-- Organization members (admin ↔ org)
-- ---------------------------------------------------------------------------

create table public.organization_members (
  id text primary key,
  org_id text not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'recruiter')),
  created_at timestamptz not null default now(),
  constraint organization_members_org_user_unique unique (org_id, user_id)
);

create index organization_members_user_id_idx on public.organization_members (user_id);
create index organization_members_org_id_idx on public.organization_members (org_id);

-- ---------------------------------------------------------------------------
-- Link candidates to auth profiles (single identity across jobs)
-- ---------------------------------------------------------------------------

alter table public.candidates
  add column if not exists profile_id uuid references public.profiles (id) on delete set null;

-- org_id is legacy context; identity is email/profile_id
alter table public.candidates
  alter column org_id drop not null;

create unique index if not exists candidates_email_unique_idx on public.candidates (lower(email));

-- ---------------------------------------------------------------------------
-- Auto-create profile on signup (account_type from app_metadata)
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  account text;
  display_name text;
begin
  account := coalesce(new.raw_app_meta_data->>'account_type', 'candidate');
  if account not in ('candidate', 'org_admin', 'partner') then
    account := 'candidate';
  end if;

  display_name := coalesce(new.raw_user_meta_data->>'full_name', '');

  insert into public.profiles (id, account_type, email, full_name)
  values (new.id, account, coalesce(new.email, ''), display_name)
  on conflict (id) do nothing;

  -- Link guest applications (same email) to this profile
  if account = 'candidate' and new.email is not null then
    update public.candidates
    set profile_id = new.id
    where lower(email) = lower(new.email) and profile_id is null;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.organization_members enable row level security;

-- Users read/update their own profile
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Org admins read profiles of candidates who applied to their org
create policy "profiles_select_org_candidates"
  on public.profiles for select
  to authenticated
  using (
    exists (
      select 1
      from public.organization_members om
      join public.job_roles j on j.org_id = om.org_id
      join public.applications a on a.job_role_id = j.id
      join public.candidates c on c.id = a.candidate_id
      where om.user_id = auth.uid()
        and c.profile_id = profiles.id
    )
  );

-- Members see their org memberships
create policy "org_members_select_own"
  on public.organization_members for select
  to authenticated
  using (user_id = auth.uid());

-- Owners/admins manage members in their org
create policy "org_members_select_same_org"
  on public.organization_members for select
  to authenticated
  using (
    exists (
      select 1 from public.organization_members om
      where om.user_id = auth.uid()
        and om.org_id = organization_members.org_id
        and om.role in ('owner', 'admin')
    )
  );

-- Candidates: read own applications via profile link
create policy "candidates_select_own"
  on public.candidates for select
  to authenticated
  using (profile_id = auth.uid());

create policy "candidates_update_own"
  on public.candidates for update
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- Tighten org-scoped admin access for job_roles (replace permissive authenticated_all)
drop policy if exists "authenticated_all_job_roles" on public.job_roles;
create policy "org_admins_job_roles"
  on public.job_roles for all
  to authenticated
  using (
    exists (
      select 1 from public.organization_members om
      where om.user_id = auth.uid() and om.org_id = job_roles.org_id
    )
  )
  with check (
    exists (
      select 1 from public.organization_members om
      where om.user_id = auth.uid() and om.org_id = job_roles.org_id
    )
  );

drop policy if exists "authenticated_all_organizations" on public.organizations;
create policy "org_admins_organizations"
  on public.organizations for select
  to authenticated
  using (
    exists (
      select 1 from public.organization_members om
      where om.user_id = auth.uid() and om.org_id = organizations.id
    )
  );
