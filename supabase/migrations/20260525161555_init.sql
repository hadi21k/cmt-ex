-- Operations Command Center: initial schema
-- Mirrors entities + fields from requirements.md §7 (Persistence and Data Model)
-- and statuses + sources from §4. Idempotency is enforced by UNIQUE(source_event_id)
-- on events per spec §4 step 7.

set check_function_bodies = off;

------------------------------------------------------------------------------
-- updated_at trigger fn (reusable)
------------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

------------------------------------------------------------------------------
-- events
------------------------------------------------------------------------------
-- One row per incoming operational event. source_event_id is the external
-- producer's id; we enforce UNIQUE on it so re-submission of the same event
-- is a no-op (spec §4 step 7: "Avoid duplicate processing using source_event_id").

create table public.events (
  id              uuid primary key default gen_random_uuid(),
  source_event_id text not null,
  source          text not null,
  event_type      text not null,
  payload         jsonb not null default '{}'::jsonb,
  status          text not null default 'received',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint events_source_event_id_key unique (source_event_id),
  constraint events_status_check check (
    status in ('received', 'processing', 'completed', 'review_required', 'failed')
  ),
  constraint events_source_check check (
    source in ('financeops', 'campaignops', 'guestops', 'unknown')
  )
);

create index events_status_idx     on public.events (status);
create index events_source_idx     on public.events (source);
create index events_created_at_idx on public.events (created_at desc);

create trigger events_set_updated_at
  before update on public.events
  for each row
  execute function public.set_updated_at();

------------------------------------------------------------------------------
-- actions
------------------------------------------------------------------------------
-- Generated actions for an event (e.g. send_payment_reminder, create_campaign_task).
-- payload is the action's own data (target, priority, channel, etc.).

create table public.actions (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events(id) on delete cascade,
  type       text not null,
  payload    jsonb not null default '{}'::jsonb,
  status     text not null default 'pending',
  created_at timestamptz not null default now(),

  constraint actions_status_check check (
    status in ('pending', 'executing', 'completed', 'failed')
  )
);

-- FK columns need explicit indexes in postgres; the FK constraint does NOT
-- create one. Without this index, deleting an event scans actions linearly.
create index actions_event_id_idx on public.actions (event_id);
create index actions_status_idx   on public.actions (status);

------------------------------------------------------------------------------
-- review_queue_items
------------------------------------------------------------------------------
-- Risky / ambiguous / failed events surface here for an operator to resolve.

create table public.review_queue_items (
  id                uuid primary key default gen_random_uuid(),
  event_id          uuid not null references public.events(id) on delete cascade,
  reason            text not null,
  status            text not null default 'open',
  resolution_notes  text,
  created_at        timestamptz not null default now(),
  resolved_at       timestamptz,

  constraint review_queue_items_status_check check (
    status in ('open', 'approved', 'rejected', 'resolved')
  )
);

create index review_queue_items_event_id_idx on public.review_queue_items (event_id);
create index review_queue_items_status_idx   on public.review_queue_items (status);

------------------------------------------------------------------------------
-- audit_logs
------------------------------------------------------------------------------
-- Append-only timeline of everything that happened to an event. Drives the
-- Event Detail Page's audit timeline (spec §3).

create table public.audit_logs (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events(id) on delete cascade,
  message    text not null,
  metadata   jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_event_id_idx   on public.audit_logs (event_id);
create index audit_logs_created_at_idx on public.audit_logs (created_at desc);

------------------------------------------------------------------------------
-- RLS
------------------------------------------------------------------------------
-- Spec §13: "Authentication or role-based permissions" is explicitly out of
-- scope. The publishable key acts as the single shared credential for this
-- internal tool. RLS is still enabled because the public schema is exposed
-- to the Data API, and Supabase best practice requires RLS on every exposed
-- table even when policies are permissive. The policies below allow the
-- `anon` role (which the publishable key uses) full access to all four tables.
-- If auth is added later, replace these with ownership-scoped policies.

alter table public.events             enable row level security;
alter table public.actions            enable row level security;
alter table public.review_queue_items enable row level security;
alter table public.audit_logs         enable row level security;

create policy "anon full access to events"
  on public.events
  for all
  to anon, authenticated
  using (true)
  with check (true);

create policy "anon full access to actions"
  on public.actions
  for all
  to anon, authenticated
  using (true)
  with check (true);

create policy "anon full access to review_queue_items"
  on public.review_queue_items
  for all
  to anon, authenticated
  using (true)
  with check (true);

create policy "anon full access to audit_logs"
  on public.audit_logs
  for all
  to anon, authenticated
  using (true)
  with check (true);
