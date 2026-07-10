-- Enterprise workflow foundations: configurable stages, requisitions,
-- human interviews, scorecards, offers, and audit activity.

alter table public.organization_members
  drop constraint if exists organization_members_role_check;

alter table public.organization_members
  add constraint organization_members_role_check
  check (
    role in (
      'owner',
      'admin',
      'recruiter',
      'hiring_manager',
      'interviewer',
      'coordinator',
      'reporting_viewer',
      'final_interviewer'
    )
  );

create table if not exists public.departments (
  id text primary key,
  org_id text not null references public.organizations(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (org_id, name)
);

create table if not exists public.requisitions (
  id text primary key,
  org_id text not null references public.organizations(id) on delete cascade,
  department_id text references public.departments(id) on delete set null,
  title text not null,
  headcount integer not null default 1 check (headcount > 0),
  budget_range text,
  hiring_manager_id uuid references public.profiles(id) on delete set null,
  status text not null default 'draft'
    check (status in ('draft', 'pending_approval', 'approved', 'rejected', 'closed')),
  approval_notes text,
  created_by uuid references public.profiles(id) on delete set null,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.job_roles
  add column if not exists department_id text references public.departments(id) on delete set null,
  add column if not exists requisition_id text references public.requisitions(id) on delete set null;

create table if not exists public.pipeline_stages (
  id text primary key,
  org_id text not null references public.organizations(id) on delete cascade,
  job_role_id text references public.job_roles(id) on delete cascade,
  name text not null,
  stage_type text not null
    check (stage_type in ('apply', 'auto_screen', 'ai_interview', 'recruiter_review', 'human_interview', 'offer', 'hired', 'rejected')),
  order_index integer not null,
  is_required boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (job_role_id, order_index)
);

alter table public.applications
  add column if not exists current_stage_id text references public.pipeline_stages(id) on delete set null;

create table if not exists public.application_stage_history (
  id text primary key,
  application_id text not null references public.applications(id) on delete cascade,
  from_stage_id text references public.pipeline_stages(id) on delete set null,
  to_stage_id text references public.pipeline_stages(id) on delete set null,
  from_status text,
  to_status text,
  actor_id uuid references public.profiles(id) on delete set null,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.scorecards (
  id text primary key,
  application_id text not null references public.applications(id) on delete cascade,
  stage_id text references public.pipeline_stages(id) on delete set null,
  reviewer_id uuid references public.profiles(id) on delete set null,
  recommendation text not null default 'hold'
    check (recommendation in ('strong_yes', 'yes', 'hold', 'no', 'strong_no')),
  overall_score numeric check (overall_score is null or (overall_score >= 0 and overall_score <= 10)),
  competencies jsonb not null default '[]'::jsonb,
  notes text,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.interview_schedules (
  id text primary key,
  application_id text not null references public.applications(id) on delete cascade,
  stage_id text references public.pipeline_stages(id) on delete set null,
  scheduled_by uuid references public.profiles(id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  location text,
  meeting_url text,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'rescheduled', 'completed', 'cancelled', 'no_show')),
  attendee_ids uuid[] not null default '{}'::uuid[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table if not exists public.offers (
  id text primary key,
  application_id text not null references public.applications(id) on delete cascade,
  status text not null default 'draft'
    check (status in ('draft', 'pending_approval', 'approved', 'sent', 'accepted', 'declined', 'withdrawn')),
  compensation jsonb not null default '{}'::jsonb,
  start_date date,
  expires_at timestamptz,
  approved_by uuid references public.profiles(id) on delete set null,
  sent_at timestamptz,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activity_log (
  id text primary key,
  org_id text not null references public.organizations(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  entity_type text not null,
  entity_id text not null,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists departments_org_id_idx on public.departments(org_id);
create index if not exists requisitions_org_id_idx on public.requisitions(org_id);
create index if not exists pipeline_stages_job_role_id_idx on public.pipeline_stages(job_role_id);
create index if not exists application_stage_history_application_id_idx on public.application_stage_history(application_id);
create index if not exists scorecards_application_id_idx on public.scorecards(application_id);
create index if not exists interview_schedules_application_id_idx on public.interview_schedules(application_id);
create index if not exists offers_application_id_idx on public.offers(application_id);
create index if not exists activity_log_org_id_idx on public.activity_log(org_id);

alter table public.departments enable row level security;
alter table public.requisitions enable row level security;
alter table public.pipeline_stages enable row level security;
alter table public.application_stage_history enable row level security;
alter table public.scorecards enable row level security;
alter table public.interview_schedules enable row level security;
alter table public.offers enable row level security;
alter table public.activity_log enable row level security;

create policy "org_members_read_departments"
  on public.departments for select to authenticated
  using (public.is_org_member(org_id));

create policy "org_managers_manage_departments"
  on public.departments for all to authenticated
  using (public.is_org_member(org_id, array['owner', 'admin']))
  with check (public.is_org_member(org_id, array['owner', 'admin']));

create policy "org_members_read_requisitions"
  on public.requisitions for select to authenticated
  using (public.is_org_member(org_id));

create policy "org_managers_manage_requisitions"
  on public.requisitions for all to authenticated
  using (public.is_org_member(org_id, array['owner', 'admin']))
  with check (public.is_org_member(org_id, array['owner', 'admin']));

create policy "org_members_read_pipeline_stages"
  on public.pipeline_stages for select to authenticated
  using (public.is_org_member(org_id));

create policy "org_managers_manage_pipeline_stages"
  on public.pipeline_stages for all to authenticated
  using (public.is_org_member(org_id, array['owner', 'admin']))
  with check (public.is_org_member(org_id, array['owner', 'admin']));

create policy "org_members_read_stage_history"
  on public.application_stage_history for select to authenticated
  using (
    exists (
      select 1
      from public.applications a
      join public.job_roles j on j.id = a.job_role_id
      where a.id = application_stage_history.application_id
        and public.is_org_member(j.org_id)
    )
  );

create policy "org_pipeline_insert_stage_history"
  on public.application_stage_history for insert to authenticated
  with check (
    exists (
      select 1
      from public.applications a
      join public.job_roles j on j.id = a.job_role_id
      where a.id = application_stage_history.application_id
        and public.is_org_member(j.org_id, array['owner', 'admin', 'recruiter', 'hiring_manager', 'coordinator'])
    )
  );

create policy "org_members_read_scorecards"
  on public.scorecards for select to authenticated
  using (
    exists (
      select 1
      from public.applications a
      join public.job_roles j on j.id = a.job_role_id
      where a.id = scorecards.application_id
        and public.is_org_member(j.org_id)
    )
  );

create policy "org_reviewers_manage_scorecards"
  on public.scorecards for all to authenticated
  using (
    exists (
      select 1
      from public.applications a
      join public.job_roles j on j.id = a.job_role_id
      where a.id = scorecards.application_id
        and public.is_org_member(j.org_id, array['owner', 'admin', 'recruiter', 'hiring_manager', 'interviewer', 'final_interviewer'])
    )
  )
  with check (
    exists (
      select 1
      from public.applications a
      join public.job_roles j on j.id = a.job_role_id
      where a.id = scorecards.application_id
        and public.is_org_member(j.org_id, array['owner', 'admin', 'recruiter', 'hiring_manager', 'interviewer', 'final_interviewer'])
    )
  );

create policy "org_members_read_interview_schedules"
  on public.interview_schedules for select to authenticated
  using (
    exists (
      select 1
      from public.applications a
      join public.job_roles j on j.id = a.job_role_id
      where a.id = interview_schedules.application_id
        and public.is_org_member(j.org_id)
    )
  );

create policy "org_pipeline_manage_interview_schedules"
  on public.interview_schedules for all to authenticated
  using (
    exists (
      select 1
      from public.applications a
      join public.job_roles j on j.id = a.job_role_id
      where a.id = interview_schedules.application_id
        and public.is_org_member(j.org_id, array['owner', 'admin', 'recruiter', 'hiring_manager', 'coordinator'])
    )
  )
  with check (
    exists (
      select 1
      from public.applications a
      join public.job_roles j on j.id = a.job_role_id
      where a.id = interview_schedules.application_id
        and public.is_org_member(j.org_id, array['owner', 'admin', 'recruiter', 'hiring_manager', 'coordinator'])
    )
  );

create policy "org_members_read_offers"
  on public.offers for select to authenticated
  using (
    exists (
      select 1
      from public.applications a
      join public.job_roles j on j.id = a.job_role_id
      where a.id = offers.application_id
        and public.is_org_member(j.org_id)
    )
  );

create policy "org_managers_manage_offers"
  on public.offers for all to authenticated
  using (
    exists (
      select 1
      from public.applications a
      join public.job_roles j on j.id = a.job_role_id
      where a.id = offers.application_id
        and public.is_org_member(j.org_id, array['owner', 'admin'])
    )
  )
  with check (
    exists (
      select 1
      from public.applications a
      join public.job_roles j on j.id = a.job_role_id
      where a.id = offers.application_id
        and public.is_org_member(j.org_id, array['owner', 'admin'])
    )
  );

create policy "org_members_read_activity_log"
  on public.activity_log for select to authenticated
  using (public.is_org_member(org_id));

create policy "org_members_insert_activity_log"
  on public.activity_log for insert to authenticated
  with check (public.is_org_member(org_id));
