-- ============================================================================
-- Task-07: slug_reservations + slug_redirects + reserved-word seed + cron sweep
-- ============================================================================
-- Two tables in `public` (per ADR-0001: ops state lives in Supabase, not Payload):
--   slug_reservations — permanent reserved words AND short-lived soft-holds.
--   slug_redirects   — 90-day 301 redirects from old → new slugs.
-- Plus a pg_cron job that sweeps expired soft-holds and old redirects.
-- ----------------------------------------------------------------------------

create extension if not exists pg_cron;

-- ----------------------------------------------------------------------------
-- slug_reservations: one table, two purposes (discriminated by `type`)
-- ----------------------------------------------------------------------------

create table if not exists public.slug_reservations (
  slug              text         primary key,
  type              text         not null,
  held_by_user_id   uuid         null,
  expires_at        timestamptz  null,
  created_at        timestamptz  not null default now(),

  constraint slug_reservations_type_check
    check (type in ('reserved', 'soft_hold')),
  constraint slug_reservations_soft_hold_has_owner
    check (type <> 'soft_hold' or (held_by_user_id is not null and expires_at is not null))
);

create index if not exists slug_reservations_expires_at_idx
  on public.slug_reservations (expires_at)
  where expires_at is not null;

create index if not exists slug_reservations_user_idx
  on public.slug_reservations (held_by_user_id)
  where held_by_user_id is not null;

-- ----------------------------------------------------------------------------
-- slug_redirects: old → new with 90-day TTL
-- ----------------------------------------------------------------------------

create table if not exists public.slug_redirects (
  old_slug    text         primary key,
  new_slug    text         not null,
  expires_at  timestamptz  not null,
  created_at  timestamptz  not null default now()
);

create index if not exists slug_redirects_expires_at_idx
  on public.slug_redirects (expires_at);

-- ----------------------------------------------------------------------------
-- Reserved-word seed (PRD §5). Idempotent.
-- ----------------------------------------------------------------------------

insert into public.slug_reservations (slug, type)
values
  ('admin','reserved'),     ('api','reserved'),         ('app','reserved'),
  ('dashboard','reserved'), ('login','reserved'),       ('signup','reserved'),
  ('signin','reserved'),    ('signout','reserved'),     ('logout','reserved'),
  ('settings','reserved'),  ('account','reserved'),     ('billing','reserved'),
  ('pricing','reserved'),   ('explore','reserved'),     ('search','reserved'),
  ('blog','reserved'),      ('help','reserved'),        ('support','reserved'),
  ('legal','reserved'),     ('terms','reserved'),       ('privacy','reserved'),
  ('about','reserved'),     ('contact','reserved'),     ('press','reserved'),
  ('presskit','reserved'),  ('assets','reserved'),      ('static','reserved'),
  ('_next','reserved'),     ('well-known','reserved')
on conflict (slug) do nothing;

-- ----------------------------------------------------------------------------
-- Sweep job: drop expired soft_holds and stale redirects every 5 min.
-- Re-running the migration replaces the job (cron.schedule is idempotent
-- on jobname).
-- ----------------------------------------------------------------------------

select cron.schedule(
  'slug-sweep-expired',
  '*/5 * * * *',
  $$
    delete from public.slug_reservations
      where type = 'soft_hold' and expires_at < now();
    delete from public.slug_redirects
      where expires_at < now();
  $$
);

-- ----------------------------------------------------------------------------
-- RLS posture: spike-only — only service-role + Payload-admin server code
-- reads/writes these tables. Hardened policies land in task-27.
-- ----------------------------------------------------------------------------

alter table public.slug_reservations enable row level security;
alter table public.slug_redirects    enable row level security;

-- No policies = no rows visible to non-superuser roles. Service-role bypasses
-- RLS entirely; that's how our /api/slug/* routes read these tables.
