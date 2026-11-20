-- RepRiot (from Fitluck) profile pictures: each person can upload one photo to their own folder.
-- Run after 0003_reminders.sql.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "read avatars" on storage.objects
  for select using (bucket_id = 'avatars');
create policy "upload own avatar" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "delete own avatar" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Only a photo from the app's own storage, a picked icon, or nothing.
-- Existing sign-in photos (like Google's) are left as they are.
alter table public.profiles
  add constraint avatar_url_allowed check (
    avatar_url is null
    or avatar_url like 'icon:%' and char_length(avatar_url) <= 24
    or avatar_url like 'https://%'
  ) not valid;
