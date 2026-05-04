# 0001 — Payload + Supabase Architecture Split

- **Status:** Accepted (spike validated)
- **Date:** 2026-04-29
- **Drivers:** Task-02 spike, PRD §7, §8, §18 row #1

## Context

PressKit.pro needs a single source of truth for content (Profiles, ProfileContent, Themes, Media metadata, SocialLinks, FeaturedTracks, InstagramConnections) and a separate, battle-tested system for auth, file storage, and analytics events. The PRD names Payload CMS for content and Supabase for auth + storage + analytics. The risk is that running both against the same Postgres collides on schema, migrations, and identity ownership.

## Decision

**Adopt the dual-schema split** as proposed in PRD §18 row #1, with the following sub-decisions:

### Authority of identity (who owns user records)
- **Supabase Auth is canonical** for `email`, password hashes, OAuth links, last-sign-in, and session state.
- **Payload `Users`** is a mirror — `auth: false`, lookup key is `supabaseUserId` (UUID, unique, indexed). It owns app-level fields: `displayName`, `role`, `plan`.
- Updates to email flow Supabase → Payload via webhook. App code never edits email in Payload directly.

### Payload admin authentication
- A separate **`Admins`** collection (`auth: true`) gates `/admin`.
- This keeps the Supabase mirror clean and means `/admin` is reachable even if Supabase is degraded.
- v2 may switch to Supabase-backed admin SSO; for now, manually seeded admin accounts.

### Schema isolation
- Payload uses the Postgres adapter with `schemaName: 'payload'`.
- Supabase migrations run only against `public` and `auth` schemas (Supabase-managed).
- `pnpm payload migrate` is the only command that writes to `payload.*`.
- Migration order on a fresh DB: **Supabase first**, then Payload.

### Sync mechanism
- A Postgres trigger on `auth.users` calls `pg_net.http_post()` against `/api/webhooks/supabase-auth` on `INSERT` and `UPDATE`.
- Payload-side handler is **idempotent** — upsert by `supabaseUserId`. Replays are safe.
- Header `x-webhook-secret` carries a shared secret; constant-time compare on the server.

### Media model (the inversion)
- Payload's built-in `upload: true` is **not used**.
- Payload `Media` is a **reference-only** collection — fields: `bucket`, `path`, `mimeType`, `size`, `width`, `height`, `alt`. No file owned by Payload.
- Browser uploads via signed Supabase Storage URL; client posts to `/api/media` afterward to register metadata in Payload.
- Public render computes the URL from `bucket + path` at request time.

## Consequences

### Positive
- Single Postgres = single backup story.
- Payload's localization, drafts, and admin UX work for content.
- Supabase RLS protects analytics + storage; Payload access control protects content.
- Storage transformations (responsive variants) handled by Supabase, not Payload.

### Negative / accepted trade-offs
- Two access-control surfaces (Payload + Supabase) — must keep ownership rules in lockstep. Mitigated by **task-27** (RLS audit) and a single helper `assertOwnsProfile(userId, profileId)` shared between both layers.
- Webhook-based sync means a brief window where a Supabase user exists but Payload mirror does not. Code paths that need the mirror must handle this with a "wait + retry" up to 5s before erroring.
- Custom Media flow means we skip Payload's `upload: true` ergonomics in admin UI. Acceptable — admins rarely upload directly; the editor (task-09 onwards) is the upload surface.

### Rejected alternatives
- **Two separate Postgres instances** — Doubles ops cost, doesn't pay for itself for our scale.
- **All-in on Payload (Payload Auth, Payload S3 storage adapter)** — Loses Supabase Auth's OAuth/magic-link UX and forces us to manage storage adapters ourselves.
- **All-in on Supabase (skip Payload)** — Loses Payload's localization, drafts, and content-modeling speed. Hand-rolling those for §10 (i18n) and §6.4 (drafts) would balloon scope.

## Verification (spike acceptance criteria)

- [x] Schema isolation: Payload migration only touches `payload.*` (verified via `\dn` + `\dt payload.*` in psql post-migrate).
- [x] Auth → Payload sync: trigger + webhook handler upsert idempotently. Test: fire same payload 3× → exactly one row.
- [x] Storage round-trip: `/spike?spike=1` page uploads a JPEG via signed URL and renders it back from a Payload Media doc.
- [x] Decision doc: this file.

See [docs/runbooks/migrations.md](../runbooks/migrations.md) for operational order of operations.
