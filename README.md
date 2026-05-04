# PressKit Pro

Next.js 15 + Payload 3 + Tailwind on Postgres (Supabase). See [docs/presskit-pro-prd.md](docs/presskit-pro-prd.md) for the full product spec and [docs/tasks/](docs/tasks/) for the work breakdown.

---

## Prerequisites

- **Node** `20.9+` or `22+` (`.nvmrc` pins the version)
- **pnpm** `9+` (or **bun**, both work — scripts use `pnpm` internally)
- **Supabase CLI** — install from <https://supabase.com/docs/guides/cli>
- **Supabase account** — free tier is fine. Dev runs against a hosted project; no Docker required.
- **cloudflared** (`brew install cloudflared`) — exposes `localhost:3000` so the hosted DB's auth trigger can reach the app's webhook.
- **psql** for one DB-level configuration step (`brew install libpq && brew link libpq --force` on macOS).

---

## Quick start

Dev runs against a **hosted Supabase project** — the full setup (project creation, credentials, migrations, tunnel) lives in [docs/runbooks/dev-hosted-supabase.md](docs/runbooks/dev-hosted-supabase.md). One-time:

```bash
git clone <repo> presskitpro-webapp
cd presskitpro-webapp
cp .env.example .env       # follow dev-hosted-supabase.md to fill in real values
pnpm install
```

Per session:

```bash
supabase link --project-ref <ref>     # one-time per machine
supabase db push                      # apply our migrations to the hosted DB
pnpm payload migrate                  # creates the `payload` schema + tables
cloudflared tunnel --url http://localhost:3000   # in its own terminal
# point app.webhook_url at the printed tunnel URL — see the runbook step 7
pnpm dev                              # Next on :3000 · Payload admin on /admin
```

Open <http://localhost:3000/admin> and create the first Payload admin user (this is a separate identity from app users — see ADR-0001).

> Prefer local Docker? `supabase start` still works — see the legacy spike runbook at [docs/runbooks/spike-task-02.md](docs/runbooks/spike-task-02.md). It's no longer the recommended dev path.

---

## Environment variables

Copy `.env.example` to `.env`, then populate each value below. Never commit `.env`.

### App

| Variable | How to get it |
|---|---|
| `NEXT_PUBLIC_APP_URL` | Your dev URL. Default `http://localhost:3000`. In production, the canonical origin (e.g. `https://presskit.pro`). |

### Payload

| Variable | How to get it |
|---|---|
| `PAYLOAD_SECRET` | Long random string. Run `openssl rand -base64 48` and paste the output. Used to sign Payload sessions. |
| `DATABASE_URI` | Supabase dashboard → **Project Settings → Database → Connection string → "Direct connection"** (port 5432). Payload writes only to the `payload` schema (configured in `payload.config.ts`). |

### Supabase

All three values come from the project dashboard:

| Variable | How to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Dashboard → **Project Settings → API → Project URL** (`https://<ref>.supabase.co`). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Dashboard → **Project Settings → API → `anon` `public`**. Safe to expose to the browser. |
| `SUPABASE_SERVICE_ROLE_KEY` | Dashboard → **Project Settings → API → `service_role` `secret`**. **Server-only — never expose to the browser.** |

### Auth-sync webhook (task-02)

| Variable | How to get it |
|---|---|
| `SUPABASE_AUTH_WEBHOOK_SECRET` | Generate with `openssl rand -hex 32`. Shared secret between the Postgres trigger on `auth.users` and `/api/webhooks/supabase-auth`. Must be set in BOTH `.env` and at the Postgres level — see next step. |

After picking the value, register it with the database. The webhook URL must be a **public** URL — in dev that's your `cloudflared` tunnel; in production it's your deployed origin.

```bash
TUNNEL_URL='https://<your-tunnel>.trycloudflare.com'   # or your prod origin
SECRET=$(grep '^SUPABASE_AUTH_WEBHOOK_SECRET=' .env | cut -d= -f2)

psql "$DATABASE_URI" <<SQL
alter database postgres set app.webhook_url    = '${TUNNEL_URL}/api/webhooks/supabase-auth';
alter database postgres set app.webhook_secret = '${SECRET}';
SQL
```

> Re-run this whenever the tunnel URL changes (free `cloudflared tunnel --url` rotates each restart). The secret stays stable.
> **Production note:** the webhook URL is your deployed origin, e.g. `https://presskit.pro/api/webhooks/supabase-auth`.

---

## Verify the setup

```bash
pnpm typecheck && pnpm lint && pnpm build
```

End-to-end smoke test (proves auth-sync + storage round-trip, per [task-02](docs/tasks/task-02-supabase-payload-spike.md)):

```bash
# Visit /spike?spike=1 in the browser and follow the on-page flow.
open http://localhost:3000/spike?spike=1
```

Detailed step-by-step: [docs/runbooks/spike-task-02.md](docs/runbooks/spike-task-02.md).

---

## Common scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Next dev server + Payload admin (hot-reload). |
| `pnpm build` | Production build. Triggers `withPayload` to regenerate the import map automatically. |
| `pnpm start` | Run the production build locally. |
| `pnpm typecheck` | TypeScript only — no emit. |
| `pnpm lint` | ESLint with Next + a11y rules. |
| `pnpm format` / `format:check` | Prettier. |
| `pnpm payload <cmd>` | Standalone Payload CLI (e.g. `migrate`, `migrate:create`). |
| `pnpm generate:types` | Regenerate `payload-types.ts` from the current collections. |
| `pnpm generate:importmap` | Manually regenerate `app/(payload)/admin/importMap.js`. Rarely needed; `pnpm build` does it. |

---

## Resetting dev state

Hosted project — wipes the linked DB and re-applies every migration:

```bash
supabase db reset --linked   # drops & recreates schemas on the hosted project
pnpm payload migrate
```

`--linked` is the safety belt: it only touches the project you ran `supabase link` against. Without it, the CLI would try to reset the local Docker stack.

---

## Architecture

- **ADR-0001:** [Payload + Supabase split](docs/decisions/0001-payload-supabase-split.md) — identity authority, schema isolation, media model, admin auth.
- **Migrations runbook:** [docs/runbooks/migrations.md](docs/runbooks/migrations.md) — order of operations between Supabase and Payload migrations.
- **Task-02 spike runbook:** [docs/runbooks/spike-task-02.md](docs/runbooks/spike-task-02.md) — verifies the end-to-end auth + storage round-trip.

---

## Troubleshooting

**`ERR_REQUIRE_ASYNC_MODULE` when running Payload CLI** — your `package.json` is missing `"type": "module"`. Payload v3 is fully ESM and tsx needs this flag to compile your config as ESM rather than CJS.

**`generate:importmap` says it can't find a collection** — usually means `pnpm install` hasn't been run since a deps change. Re-run install, then retry.

**Webhook fires but Payload `Users` collection stays empty** — confirm `app.webhook_url` and `app.webhook_secret` are set at the database level (`select current_setting('app.webhook_url', true);`). The most common dev cause is a stale `cloudflared` tunnel URL — re-run the `alter database … set app.webhook_url` step from the runbook with the current tunnel.

**Storage upload returns 403** — RLS on `storage.objects`. The migration in `supabase/migrations/` grants the spike-friendly posture (public read, authenticated write); production-hardened policies land in [task-27](docs/tasks/task-27-security-rls-and-rate-limits.md).
