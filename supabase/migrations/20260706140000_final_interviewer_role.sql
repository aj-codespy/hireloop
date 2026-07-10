-- Allow final interviewers as org members (Final Interview portal)
alter table public.organization_members
  drop constraint if exists organization_members_role_check;

alter table public.organization_members
  add constraint organization_members_role_check
  check (role in ('owner', 'admin', 'recruiter', 'final_interviewer'));
