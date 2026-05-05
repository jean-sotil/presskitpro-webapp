# Migrations Runbook

Two systems write DDL to the same Postgres database. They MUST be applied in this order on every environment.

## Schemas at a glance

| Schema | Owner | Tooling |
|---|---|---|
| `auth`, `storage`, `realtime`, `extensions` | Supabase platform | `supabase db push` / `supabase migration up` |
| `public` | Application — Supabase migrations + seeds | `supabase migration up` |
| `payload` | Payload CMS | `pnpm payload migrate` |

## Fresh environment bootstrap

Dev and CI run against a **hosted** Supabase project — see
[dev-hosted-supabase.md](./dev-hosted-supabase.md) for the full walk-through.

```bash
# 1. Link the local repo to the hosted Supabase project (one-time per machine).
supabase link --project-ref <ref>

# 2. Apply our Supabase migrations (storage buckets, triggers, analytics).
supabase db push

# 3. Apply Payload migrations into the `payload` schema.
pnpm payload migrate

# 4. Seed (idempotent demo data).
pnpm seed
```

> Legacy local Docker path (`supabase start` + `supabase migration up` +
> `pnpm payload migrate`) still works for anyone who needs it — see
> [spike-task-02.md](./spike-task-02.md). Not the recommended path.

## Migrations to date

| File | Adds |
|---|---|
| `20260429000001_spike_storage_and_auth_webhook.sql` | task-02 spike: storage buckets + auth.users → webhook trigger |
| `20260504000001_slug_reservations_and_redirects.sql` | task-07: `slug_reservations` + `slug_redirects` + 29 reserved-word seed (PRD §5) + `pg_cron` sweep job (`slug-sweep-expired`, every 5 min) |
| `migrations/20260505_015050.ts` (Payload) | task-08 baseline: `payload.{admins,users,profiles,media}` + Payload internals (`payload_migrations`, `payload_locked_documents*`, `payload_preferences*`) |
| `migrations/20260505_070813_task_08_collections.ts` (Payload) | task-08 collections: `profile_content` (+ `_locales` + `_services`), `social_links`, `featured_tracks`, `themes` (+ `_section_order`), `instagram_connections`. Adds press-kit + locale columns to `profiles`; adds Payload-managed auth columns to `users` (sessions, salt/hash, lock fields — present even though local strategy is disabled because `enableFields: true` keeps the schema stable). |

The `pg_cron` job lives in the `cron.job` table — verify with `select jobname, schedule from cron.job;` (requires service-role / superuser). Re-running the migration is idempotent: `cron.schedule` replaces by jobname, and the seed uses `ON CONFLICT DO NOTHING`.

## Daily dev cycle

- Schema change in `payload/collections/*`: `pnpm payload migrate:create <name>` → review SQL → commit.
- Schema change in `public` (analytics, slug_reservations, etc.): `supabase migration new <name>` → write SQL → commit.

## Orphaned auth.users after a `payload` schema reset

Dropping `payload.*` (the recovery from dev-mode auto-push drift, below) nukes `payload.users` along with everything else. Existing Supabase Auth sessions stay valid (Supabase doesn't know or care about Payload), so users *appear* logged in but every Payload-side action — onboarding, editor, REST routes — surfaces `mirror-pending` because no row matches their `supabaseUserId`.

The auth-sync webhook (task-02) only fires on `auth.users` INSERT / UPDATE, so it doesn't retroactively backfill. Two ways to recover:

1. **Backfill SQL (preferred for dev).** Inserts a Payload mirror row for every auth.users that's missing one:

   ```sql
   insert into payload.users (supabase_user_id, email, role, plan, created_at, updated_at)
   select au.id, au.email, 'user', 'free', now(), now()
   from auth.users au
   left join payload.users pu on pu.supabase_user_id = au.id
   where pu.id is null
   on conflict do nothing;
   ```

2. **Re-fire the webhook** for an existing user: `update auth.users set updated_at = now() where id = '<id>'`. Useful when you specifically want to test the webhook path.

CI doesn't see this — fresh DBs come up via `pnpm payload migrate` + `pnpm seed` with synthetic users that the seed creates directly.

## Dev-mode auto-push drift

If `pnpm payload migrate` prompts:

> "It looks like you've run Payload in dev mode, meaning you've dynamically pushed changes to your database. If you'd like to run migrations, data loss will occur. Would you like to proceed?"

— it means the `payload` schema in your dev DB was bootstrapped by Payload's dev-mode auto-push (the default `pnpm dev` behavior) rather than by `payload migrate`. Payload tracks applied migrations in `payload.payload_migrations`; if that table is empty (or out of sync with files in `migrations/`), running `migrate` will try to drop and recreate tables to align with file order — losing anything you put through the admin UI.

Two ways to clear it:

1. **Fresh dev DB (preferred for local).** Reset the `payload` schema and re-apply from scratch:
   ```sql
   drop schema if exists payload cascade;
   ```
   Then `pnpm payload migrate` runs all migration files in order.

2. **Mark migrations as applied** if your DB schema *already* matches the migration files (e.g. you've been auto-pushing the same shape). Insert rows into `payload.payload_migrations` for each applied filename. Verify schema parity first by diffing `payload.*` against the migration's `up()` SQL.

In CI, schemas are always created via `pnpm payload migrate` against an ephemeral DB, so this prompt never fires.

## Conflict prevention rules

1. **Never** edit a Payload-generated migration by hand. Generate, review, regenerate if wrong.
2. **Never** create tables in `public` from Payload. Payload writes only to `payload.*` (enforced by `schemaName: 'payload'`).
3. **Never** run `CREATE EXTENSION` from Payload migrations. All extensions belong in Supabase migrations (`pgcrypto`, `pg_net`, `pg_trgm`, etc.).
4. **Never** `DROP SCHEMA payload CASCADE` outside a explicit Payload reset — the cascade will silently delete Media references but not the Supabase Storage objects they point to (storage bucket cleanup is separate).

## Rollback

- Payload: `pnpm payload migrate:down` (one step at a time; review SQL first).
- Supabase: revert the migration file and apply a corrective migration. Never edit applied files.

## Disaster recovery

- Supabase nightly snapshots cover **all** schemas (Supabase platform feature).
- A snapshot restore brings back `payload.*` automatically.
- After restore, run `pnpm payload migrate` to ensure Payload's migration table state matches the deployed code.

## Encryption keys

`InstagramConnections.accessToken` is encrypted at rest using AES-256-GCM with `INSTAGRAM_TOKEN_ENCRYPTION_KEY` (see `.env.example`). The key is **per-environment** — staging and prod must each have their own. Generate with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Rotation: mint a new key, decrypt every stored token with the old key, re-encrypt under the new key in a single transaction. The current ciphertext format is `iv.tag.body`; future versions will prefix `v2:` so a rotation script can branch on the prefix and decrypt either side.
