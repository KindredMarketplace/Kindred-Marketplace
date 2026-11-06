-- =============================================================================
-- 00019_cna_application_pipeline.sql
-- Supports the human-gated CNA application review pipeline:
--   submitted -> interviewing -> verifying -> approved
--                              \-> rejected / waitlisted (at any human gate)
--
-- Ordering reflects the decided process: a lightweight application comes first,
-- then a human screen/interview, and ONLY THEN the expensive verification
-- (license, L2 background check, ID, CPR/BLS, TB, two references).
--
-- Applied to project fibrhkrdyadnuebwovac on 2026-06-08.
-- =============================================================================

alter table public.cna_profiles
  add column if not exists application_submitted_at timestamptz,
  add column if not exists interview_at timestamptz,
  add column if not exists application_decline_reason text,
  add column if not exists application_notes text,
  add column if not exists application_answers jsonb;

-- Normalize any legacy value before locking the vocabulary.
update public.cna_profiles
  set application_status = 'interviewing'
  where application_status = 'under_review';

-- Lock the stage vocabulary so the app and the DB can never disagree.
alter table public.cna_profiles
  drop constraint if exists cna_profiles_application_status_chk;
alter table public.cna_profiles
  add constraint cna_profiles_application_status_chk
  check (application_status in (
    'incomplete',   -- started the apply form, not yet submitted
    'submitted',    -- application in; awaiting first human screen
    'interviewing', -- passed screen; interview to be held / scheduled
    'verifying',    -- passed interview; license/BG/ID/CPR/TB/references in progress
    'approved',     -- live in Browse
    'rejected',     -- declined at a human gate
    'waitlisted'    -- good candidate, not onboarding right now
  ));

create index if not exists cna_profiles_app_status_idx
  on public.cna_profiles(application_status);

comment on column public.cna_profiles.application_answers is
  'Screening Q&A captured at apply time (customer-discovery-style questions). Shape: [{"q":..,"a":..}]. Populated by the apply flow when built.';
comment on column public.cna_profiles.application_notes is
  'Private admin/recruiter notes from screening + interview. Never shown to families or the CNA.';
comment on column public.cna_profiles.application_decline_reason is
  'Why an application was rejected. Internal; basis for honest feedback to the applicant.';
