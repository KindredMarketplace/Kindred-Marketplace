-- Public contact-form submissions from the marketing site.
-- Writes happen via the service client (server action); reads are admin-only.
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  role text,
  message text not null,
  status text not null default 'new' check (status in ('new', 'read', 'archived')),
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

-- Admins can read/manage; no public select. Inserts come through the service client.
drop policy if exists contact_messages_admin_all on public.contact_messages;
create policy contact_messages_admin_all on public.contact_messages
  for all
  using (kindred_internal.is_admin())
  with check (kindred_internal.is_admin());

create index if not exists contact_messages_created_idx
  on public.contact_messages (created_at desc);
