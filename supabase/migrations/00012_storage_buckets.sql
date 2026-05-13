-- =============================================================================
-- 00012_storage_buckets.sql
-- Define Supabase Storage buckets and their access policies.
--
-- Buckets:
--   kindred-avatars      Public — user/CNA profile photos
--   kindred-documents    Private — licenses, BG checks, references, etc.
--   kindred-job-attachments  Private — photos clients attach to job posts
--   kindred-public       Public — logos for partners, site assets
-- =============================================================================

-- Avatars: public read, authenticated write to your own folder
insert into storage.buckets (id, name, public)
values ('kindred-avatars', 'kindred-avatars', true)
on conflict (id) do nothing;

-- Documents: private — RLS controls access
insert into storage.buckets (id, name, public)
values ('kindred-documents', 'kindred-documents', false)
on conflict (id) do nothing;

-- Job attachments: private
insert into storage.buckets (id, name, public)
values ('kindred-job-attachments', 'kindred-job-attachments', false)
on conflict (id) do nothing;

-- Public assets — logos, hero images
insert into storage.buckets (id, name, public)
values ('kindred-public', 'kindred-public', true)
on conflict (id) do nothing;

-- =============================================================================
-- AVATAR POLICIES
-- Path convention: <user_id>/<filename>
-- =============================================================================
create policy "Avatars: public read"
  on storage.objects for select
  using (bucket_id = 'kindred-avatars');

create policy "Avatars: users upload to own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'kindred-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Avatars: users update own"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'kindred-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Avatars: users delete own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'kindred-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- =============================================================================
-- DOCUMENTS POLICIES — strict
-- Path convention: <user_id>/<doc_id>.<ext>
-- Only the owning user (or admin) can read/write.
-- =============================================================================
create policy "Documents: owner read"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'kindred-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Documents: owner upload"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'kindred-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Documents: owner update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'kindred-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Documents: owner delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'kindred-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- =============================================================================
-- JOB ATTACHMENTS POLICIES
-- =============================================================================
create policy "Job attachments: poster read/write"
  on storage.objects for all to authenticated
  using (
    bucket_id = 'kindred-job-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- =============================================================================
-- PUBLIC ASSETS — admin write, anyone read
-- =============================================================================
create policy "Public: anyone read"
  on storage.objects for select
  using (bucket_id = 'kindred-public');

-- Admin write enforced in app layer using service_role key.
