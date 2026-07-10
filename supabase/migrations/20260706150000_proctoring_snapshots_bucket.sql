-- Proctoring snapshot storage (private bucket; access via service role only)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'proctoring-snapshots',
  'proctoring-snapshots',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;
