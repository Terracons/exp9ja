-- Run after schema.sql. Adds listing photos (Supabase Storage, free tier).
alter table listings add column if not exists image_url text;
insert into storage.buckets (id, name, public) values ('listings', 'listings', true) on conflict (id) do nothing;
create policy "listing images public read" on storage.objects for select using (bucket_id = 'listings');
create policy "suppliers upload own listing images" on storage.objects for insert to authenticated
  with check (bucket_id = 'listings' and (storage.foldername(name))[1] = auth.uid()::text);
