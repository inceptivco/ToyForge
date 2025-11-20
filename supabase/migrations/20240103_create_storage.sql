-- Create Storage Bucket
insert into storage.buckets (id, name, "public")
values ('generations', 'generations', true)
on conflict (id) do nothing;

-- Policies for Storage
drop policy if exists "Public Access" on storage.objects;
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'generations' );

drop policy if exists "Authenticated Users can upload" on storage.objects;
create policy "Authenticated Users can upload"
  on storage.objects for insert
  with check ( bucket_id = 'generations' and auth.role() = 'authenticated' );

-- Allow Service Role (Edge Function) to upload
drop policy if exists "Service Role can upload" on storage.objects;
create policy "Service Role can upload"
  on storage.objects for insert
  with check ( bucket_id = 'generations' );
