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

The `pg_cron` job lives in the `cron.job` table — verify with `select jobname, schedule from cron.job;` (requires service-role / superuser). Re-running the migration is idempotent: `cron.schedule` replaces by jobname, and the seed uses `ON CONFLICT DO NOTHING`.

## Daily dev cycle

- Schema change in `payload/collections/*`: `pnpm payload migrate:create <name>` → review SQL → commit.
- Schema change in `public` (analytics, slug_reservations, etc.): `supabase migration new <name>` → write SQL → commit.

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
