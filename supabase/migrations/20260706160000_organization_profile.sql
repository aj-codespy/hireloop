-- Organization profile fields for admin company page
alter table public.organizations
  add column if not exists website text,
  add column if not exists about text;
