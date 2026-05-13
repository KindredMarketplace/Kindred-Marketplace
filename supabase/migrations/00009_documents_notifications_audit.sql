-- =============================================================================
-- 00009_documents_notifications_audit.sql
-- Document vault, in-app notifications, audit log (HIPAA-required logging).
-- =============================================================================

-- =============================================================================
-- TABLE: documents
-- All uploaded files: CNA license, BG check report, CPR card, references,
-- LTC reimbursement docs, etc. Files live in Supabase Storage; this table
-- holds the metadata + ACL pointer.
-- =============================================================================
create type public.document_type as enum (
  'license',
  'bg_check',
  'cpr_card',
  'first_aid_card',
  'tb_test',
  'covid_vax',
  'immunization_record',
  'reference_letter',
  'liability_insurance',
  'auto_insurance',
  'drivers_license',
  'profile_photo',
  'id_verification',
  'w9',
  'visit_log',         -- generated for LTC reimbursement
  'invoice',
  'other'
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type public.document_type not null,
  -- Path in Supabase Storage bucket. Bucket name in lib/supabase/storage.ts.
  storage_path text not null,
  -- Original filename — display only
  original_filename text,
  mime_type text,
  size_bytes int,
  -- Optional metadata
  issued_at date,
  expires_at date,
  -- For LTC reimbursement docs — which booking did this come from
  related_booking_id uuid references public.bookings(id) on delete set null,
  -- Encryption status
  is_encrypted boolean not null default false,
  uploaded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index documents_user_idx on public.documents(user_id);
create index documents_type_idx on public.documents(type);
create index documents_expiring_idx on public.documents(expires_at)
  where expires_at is not null;

create trigger documents_set_updated_at
  before update on public.documents
  for each row execute function public.set_updated_at();

comment on table public.documents is
  'Metadata for files in Supabase Storage. Storage bucket = `kindred-documents` (private).';

-- Now wire the FK from cna_verifications.document_id → documents.id
alter table public.cna_verifications
  add constraint cna_verifications_document_fk
  foreign key (document_id) references public.documents(id) on delete set null;

-- =============================================================================
-- TABLE: notifications
-- In-app notifications. Email/SMS are sent via Resend/Twilio separately and
-- referenced here for proof-of-delivery.
-- =============================================================================
create type public.notification_type as enum (
  'job_match',           -- new job in CNA's area
  'job_application',     -- CNA applied to client's job
  'application_accepted',
  'application_rejected',
  'booking_confirmed',
  'shift_reminder',
  'shift_starting_soon',
  'message_received',
  'payment_received',
  'payment_failed',
  'review_received',
  'document_expiring',
  'bg_check_complete',
  'tier_promotion',
  'system_announcement'
);

create type public.notification_channel as enum (
  'in_app',
  'email',
  'sms',
  'push'
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type public.notification_type not null,
  channel public.notification_channel not null default 'in_app',
  title text not null,
  body text,
  -- Deep link to the relevant page
  action_url text,
  -- Linked entities (any may be null)
  job_id uuid references public.jobs(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete cascade,
  message_id uuid references public.messages(id) on delete cascade,
  -- Delivery tracking
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  external_id text, -- Resend / Twilio message ID
  created_at timestamptz not null default now()
);

create index notifications_user_unread_idx on public.notifications(user_id, created_at desc)
  where read_at is null;
create index notifications_user_all_idx on public.notifications(user_id, created_at desc);

-- =============================================================================
-- TABLE: audit_log
-- Required for HIPAA — log every access to PHI. We log it unconditionally now
-- so we have history when we move to HIPAA tier.
-- =============================================================================
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  action text not null,            -- 'read'|'create'|'update'|'delete'|'login'|'logout'
  resource_type text not null,     -- 'care_recipient' | 'message' | 'document' | etc.
  resource_id uuid,
  ip_address inet,
  user_agent text,
  -- For sensitive reads, log which fields were accessed
  accessed_fields text[],
  -- Free-form context
  context jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_user_idx on public.audit_log(user_id, created_at desc);
create index audit_log_resource_idx on public.audit_log(resource_type, resource_id);
create index audit_log_created_idx on public.audit_log(created_at desc);

comment on table public.audit_log is
  'HIPAA-required: log all access to PHI. Retain minimum 6 years per HIPAA.';

-- =============================================================================
-- TABLE: user_devices
-- Push notification tokens + device tracking. P1.
-- =============================================================================
create table public.user_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  device_token text not null,
  platform text not null, -- 'ios' | 'android' | 'web'
  last_active_at timestamptz default now(),
  created_at timestamptz not null default now(),
  unique (user_id, device_token)
);

create index user_devices_user_idx on public.user_devices(user_id);
