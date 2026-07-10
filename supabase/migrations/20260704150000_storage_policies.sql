-- Storage bucket policies for application document uploads
-- Bucket `application-files` should be created in Dashboard (private, 10MB limit).

create policy "org_admins_read_application_files"
on storage.objects for select
to authenticated
using (
  bucket_id = 'application-files'
  and exists (
    select 1
    from public.organization_members om
    join public.job_roles j on j.org_id = om.org_id
    join public.applications a on a.job_role_id = j.id
    where om.user_id = auth.uid()
      and om.role in ('owner', 'admin', 'recruiter')
      and (storage.foldername(name))[1] = j.org_id
      and (storage.foldername(name))[3] = a.id
  )
);

create policy "candidates_read_own_application_files"
on storage.objects for select
to authenticated
using (
  bucket_id = 'application-files'
  and exists (
    select 1
    from public.applications a
    join public.candidates c on c.id = a.candidate_id
    where c.profile_id = auth.uid()
      and (storage.foldername(name))[3] = a.id
  )
);
