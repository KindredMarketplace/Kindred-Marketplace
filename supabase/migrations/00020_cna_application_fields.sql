-- =============================================================================
-- 00020_cna_application_fields.sql
-- Stage 1 application fields: low-friction front door.
--   - pronouns (optional courtesy field)
--   - resume_path: private file in kindred-documents
--   - application_media_path + kind: the one 2-3 min video/audio answer
--
-- Deliberately NOT collected here: SSN (Stripe Connect handles tax identity at
-- payout onboarding), driver's license (ID verification is a Stage 3 step),
-- and any race/gender/ethnicity data (not collected, ever).
--
-- Applied to project fibrhkrdyadnuebwovac on 2026-06-09.
-- =============================================================================

alter table public.cna_profiles
  add column if not exists pronouns text,
  add column if not exists resume_path text,
  add column if not exists application_media_path text,
  add column if not exists application_media_kind text;

alter table public.cna_profiles
  drop constraint if exists cna_profiles_application_media_kind_chk;
alter table public.cna_profiles
  add constraint cna_profiles_application_media_kind_chk
  check (application_media_kind is null or application_media_kind in ('video', 'audio'));

comment on column public.cna_profiles.application_media_path is
  'The applicant''s 2-3 min video/audio answer to the one prompt. Private (kindred-documents). Kept only for hires; deleted when a rejected application is purged.';
comment on column public.cna_profiles.resume_path is
  'Uploaded resume, private (kindred-documents). Deleted when a rejected application is purged.';
