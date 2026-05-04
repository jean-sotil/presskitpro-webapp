# Runbook — Task-02 Spike Verification (Local Docker — Legacy)

> **This runbook archives the original local-Docker spike that validated
> ADR-0001 on 2026-04-29.** The active dev path is hosted Supabase — see
> [dev-hosted-supabase.md](./dev-hosted-supabase.md). The acceptance
> criteria below are the same on either path; only the environment differs.

End-to-end manual run that exercises every acceptance criterion. ~10 minutes the first time, faster after.

## Prereqs

- `pnpm install` (the spike adds `@supabase/supabase-js` and `@supabase/ssr` — see `package.json`).
- `supabase` CLI installed.
- Two terminals.

## 1. Start Supabase + apply our migrations

```bash
supabase start                         # boots local Postgres + Studio
supabase migration up                  # applies 20260429000001_spike_*.sql
```

Configure the database settings the trigger reads:

```bash
SECRET=$(openssl rand -hex 32)
echo "SUPABASE_AUTH_WEBHOOK_SECRET=$SECRET" >> .env
psql "$DATABASE_URI" <<SQL
alter database postgres set app.webhook_url    = 'http://host.docker.internal:3000/api/webhooks/supabase-auth';
alter database postgres set app.webhook_secret = '$SECRET';
SQL
```

> Note: `host.docker.internal` resolves the host from inside Supabase's Docker network on Mac/Windows. On Linux, use the host's LAN IP.

## 2. Start Payload + Next

```bash
pnpm payload migrate                   # creates payload.* schema
pnpm dev                               # Next on :3000, /admin reachable
```

Confirm schema isolation:

```bash
psql "$DATABASE_URI" -c "\dn"          # expect: auth, public, storage, payload, ...
psql "$DATABASE_URI" -c "\dt payload.*"   # expect: users, admins, profiles, media, payload_*
psql "$DATABASE_URI" -c "\dt public.*"    # expect: ZERO Payload-prefixed tables
```

✅ **AC2 passes** when `public.*` has no `payload_*` tables.

## 3. Bootstrap a Payload admin

Visit http://localhost:3000/admin and create the first Admin user (Payload's first-run flow). This is a separate identity from app users.

## 4. Trigger an auth user → assert sync

In Supabase Studio (http://localhost:54323) → Authentication → Add user → email `dj-test@example.com` → confirm immediately.

Within 5 seconds, visit http://localhost:3000/spike?spike=1 and confirm the synced user appears.

✅ **AC1 passes**.

Idempotency check:

```bash
# Update the same user 3 times in Supabase Studio. Each fires the trigger.
# Then assert exactly one Payload row exists for that supabaseUserId:
psql "$DATABASE_URI" -c "select count(*) from payload.users where \"supabaseUserId\" = '<uuid>';"
# expected: 1
```

## 5. Storage round-trip

Still on `/spike?spike=1`:

1. Sign in as `dj-test@example.com` via Supabase Auth (use the magic link from Studio's Inbucket: http://localhost:54324).
2. Pick a JPEG ≤ 2MB in the upload widget.
3. Status flow: `idle → signing → uploading → registering → done`.
4. Image preview appears, fed by the public URL of the Supabase Storage object.
5. Section 3 of the page lists the new Media doc with bucket/path/size/alt.

✅ **AC3 passes**.

## 6. Final checklist (AC4)

- [x] `docs/decisions/0001-payload-supabase-split.md` exists and reflects what was actually built.
- [x] This runbook archived under `docs/runbooks/spike-task-02.md`.
- [x] Cleanup plan: `/spike` route stays in the codebase but only renders with `?spike=1`. Remove or repurpose when task-09 (real editor) ships.
