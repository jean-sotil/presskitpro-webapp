-- ============================================================================
-- Task-24: per-profile analytics pipeline
-- ============================================================================
-- Three tables, all `public` schema (ADR-0001 — ops state lives in Supabase):
--
--   analytics_events        raw fire-and-forget event stream from /api/track
--   analytics_daily_rollups per (profile, event, day) aggregates + top referrers
--   analytics_salts         daily-rotating salt for the visitor hash
--
-- Service-role only (RLS enabled, no policies). Reads happen via the Supabase
-- service-role client inside server-only code paths.
-- ----------------------------------------------------------------------------

-- ----------------------------------------------------------------------------
-- analytics_events — append-only, write-mostly, indexed for the daily rollup
-- ----------------------------------------------------------------------------

create table if not exists public.analytics_events (
  id              bigserial    primary key,
  profile_id      bigint       not null,
  event_type      text         not null,
  occurred_at     timestamptz  not null default now(),
  visitor_hash    text         null,
  referrer_host   text         null,
  locale          text         null,
  country         text         null,

  constraint analytics_events_event_type_check
    check (event_type in ('page_view', 'press_kit_click', 'contact_click', 'social_click'))
);

-- The rollup cron filters by occurred_at, then groups by (profile_id, event_type).
create index if not exists analytics_events_occurred_at_idx
  on public.analytics_events (occurred_at);

create index if not exists analytics_events_profile_day_idx
  on public.analytics_events (profile_id, (occurred_at::date), event_type);

-- ----------------------------------------------------------------------------
-- analytics_daily_rollups — what the dashboard actually reads
-- ----------------------------------------------------------------------------

create table if not exists public.analytics_daily_rollups (
  profile_id     bigint       not null,
  event_type     text         not null,
  day            date         not null,
  count          integer      not null default 0,
  unique_count   integer      not null default 0,
  top_referrers  jsonb        not null default '[]'::jsonb,
  computed_at    timestamptz  not null default now(),

  primary key (profile_id, event_type, day),
  constraint analytics_daily_rollups_event_type_check
    check (event_type in ('page_view', 'press_kit_click', 'contact_click', 'social_click'))
);

-- The dashboard SELECTs by (profile_id, day BETWEEN …); the PK already covers
-- that prefix, so no extra index is needed.

-- ----------------------------------------------------------------------------
-- analytics_salts — one row per UTC date
-- ----------------------------------------------------------------------------

create table if not exists public.analytics_salts (
  day         date         primary key,
  salt        bytea        not null,
  created_at  timestamptz  not null default now()
);

-- ----------------------------------------------------------------------------
-- RLS — service-role only (same posture as slug_* tables; task-27 hardens)
-- ----------------------------------------------------------------------------

alter table public.analytics_events        enable row level security;
alter table public.analytics_daily_rollups enable row level security;
alter table public.analytics_salts         enable row level security;

-- No policies = no rows visible to non-superuser roles.
