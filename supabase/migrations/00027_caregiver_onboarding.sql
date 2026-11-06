-- =============================================================================
-- 00027 — Phase 2: caregiver onboarding to "listed"
--
--   - cna_profiles.experience_hours_reported: what the caregiver tells us.
--     The Kindred Standard keeps using experience_hours, which only an admin
--     (or the server) can set after checking. Caregivers can edit their own
--     reported number; the guard trigger from 00024 still pins the real one.
--   - cna_profiles.credential: CNA / HHA / LPN / RN / other. Kindred is for
--     experienced home health workers generally, not only certified CNAs.
--   - kindred-avatars: the old "public read" policy let anyone LIST the bucket
--     (and enumerate user ids from folder names). Public URLs keep working
--     without it; listing is now owner / admin only.
--   - kindred-documents: 15 MB cap per file, documents + images only for the
--     verification folder is enforced in the app; the bucket keeps a higher cap
--     because application videos also live there.
-- =============================================================================

alter table public.cna_profiles
  add column if not exists experience_hours_reported integer
    check (experience_hours_reported is null or (experience_hours_reported >= 0 and experience_hours_reported <= 200000)),
  add column if not exists credential text
    check (credential is null or credential in ('cna', 'hha', 'lpn', 'rn', 'other'));

comment on column public.cna_profiles.experience_hours_reported is
  'Hours the caregiver reports. Not trusted for listing; an admin confirms into experience_hours.';

-- Avatars: stop anonymous listing of the bucket.
drop policy if exists "Avatars: public read individual object" on storage.objects;
drop policy if exists "Avatars: owner or admin read" on storage.objects;
create policy "Avatars: owner or admin read" on storage.objects
  for select to authenticated using (
    bucket_id = 'kindred-avatars'
    and ((storage.foldername(name))[1] = (auth.uid())::text or kindred_internal.is_admin())
  );

-- Size / type limits.
update storage.buckets
   set file_size_limit = 5242880,
       allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
 where id = 'kindred-avatars';

update storage.buckets
   set file_size_limit = 209715200
 where id = 'kindred-documents' and file_size_limit is null;

notify pgrst, 'reload schema';
