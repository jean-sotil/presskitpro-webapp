# Runbook — Dev Against Hosted Supabase

This is the **standard dev path**. No Docker required. Architecture (ADR-0001)
is unchanged — only the dev-time wiring differs from the original spike, which
is archived at [spike-task-02.md](./spike-task-02.md).

## One-time setup

### 1. Create a hosted project

1. https://supabase.com/dashboard → **New project**.
2. Pick a region close to you. Save the database password somewhere safe — you
   will not see it again.
3. Wait for provisioning (~2 minutes).

### 2. Capture credentials

From the dashboard:

| Where | What | Goes into `.env` as |
|---|---|---|
| Settings → API → Project URL | `https://<ref>.supabase.co` | `NEXT_PUBLIC_SUPABASE_URL` |
| Settings → API → `anon` `public` | long JWT | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Settings → API → `service_role` | long JWT (**server-only — never ship to the browser**) | `SUPABASE_SERVICE_ROLE_KEY` |
| Settings → Database → Connection string → "Direct connection" | `postgresql://postgres.<ref>:<pwd>@…pooler.supabase.com:5432/postgres` | `DATABASE_URI` |

> The direct (5432) URI is what you want for DDL — Payload migrations and
> ad-hoc `psql` admin commands. If you later want a separate runtime URI for
> the app, switch to the transaction pooler (6543) URI.

### 3. Auth settings (dashboard → Authentication → Sign In / Providers)

For dev convenience:

- **Email** → keep enabled, **disable** "Confirm email" so users go straight to
  active without inbox round-trips. Re-enable for staging/prod.
- **Site URL** = `http://localhost:3000`.
- **Additional redirect URLs** include `http://localhost:3000/**`.

### 4. Link the CLI to the hosted project

```bash
supabase link --project-ref <ref>
# enter the database password from step 1 when prompted
```

### 5. Push migrations to the hosted DB

```bash
supabase db push          # applies supabase/migrations/*.sql to hosted
pnpm payload migrate      # applies Payload schema to payload.*
```

Verify schema isolation the same way the spike runbook does:

```bash
psql "$DATABASE_URI" -c "\dn"
psql "$DATABASE_URI" -c "\dt payload.*"
psql "$DATABASE_URI" -c "\dt public.*"   # zero payload_* tables
```

## Per-session setup (the webhook tunnel)

The `auth.users` trigger calls `pg_net.http_post()` from Supabase's cloud
infrastructure. It cannot reach `localhost`, so we expose `:3000` over a
public tunnel.

### 6. Start a Cloudflare tunnel

Install once:

```bash
brew install cloudflared
```

Each session, in its own terminal:

```bash
cloudflared tunnel --url http://localhost:3000
```

Cloudflared prints a URL like `https://random-words-1234.trycloudflare.com`.
**Keep this terminal open** for the duration of the session.

> The free quick-tunnel URL changes every time you restart it. If that becomes
> annoying, create a Cloudflare account and a named tunnel, or substitute
> `ngrok http 3000`.

### 7. Point the trigger at the tunnel

```bash
TUNNEL_URL='https://random-words-1234.trycloudflare.com'
SECRET=$(grep ^SUPABASE_AUTH_WEBHOOK_SECRET .env | cut -d= -f2)

psql "$DATABASE_URI" <<SQL
alter database postgres set app.webhook_url    = '${TUNNEL_URL}/api/webhooks/supabase-auth';
alter database postgres set app.webhook_secret = '${SECRET}';
SQL
```

You only need to re-run this when the tunnel URL changes. The secret stays
stable.

> Alternative without `psql`: Supabase dashboard → SQL Editor → run the two
> `alter database` statements there.

### 8. Start Next, then smoke-test

```bash
pnpm dev
```

Hit `http://localhost:3000/spike?spike=1` and run sections 4 and 5 of the
[spike runbook](./spike-task-02.md):

- Create an auth user in dashboard → Authentication → Add user, then watch
  the synced row appear on `/spike?spike=1`.
- Upload a JPEG via the spike widget; confirm the Media doc lands in Payload.

If the trigger fires but the webhook handler 401s, the secret is mismatched.
If nothing arrives at all, your tunnel URL is stale — re-run step 7.

## Switching back to local

Restore the LOCAL block in `.env`, then:

```bash
supabase unlink              # detach from the hosted project (optional)
supabase start
supabase migration up
pnpm payload migrate
```

## Custom SMTP (Resend) — required for any meaningful auth testing

Supabase's free tier shared SMTP is throttled to ~4 emails/hour per project — you'll hit the limit in about three login attempts. Resend's free tier (3,000/month) is more than enough for dev and production.

### One-time setup

1. **resend.com/signup** — use the email you want magic links delivered to.
2. **API Keys → Create API Key** → name `presskitpro-dev` → permissions **Full access** → **Create**. Copy the `re_…` key immediately (shown once).
3. Supabase dashboard → **Project Settings → Authentication → SMTP Settings** → toggle **Enable Custom SMTP** ON. Fill:

   | Field | Value |
   |---|---|
   | Host | `smtp.resend.com` |
   | Port | `465` |
   | Username | `resend` |
   | Password | the `re_…` key |
   | Sender email | `onboarding@resend.dev` |
   | Sender name | `PressKit Pro` |

   Save. Supabase verifies the connection — green checkmark expected.

### Resend free-tier caveat

While your Resend account is **unverified** (no custom domain registered), you can only send to the **email address you signed up with**. Trying to send to any other recipient returns a 403.

To unlock arbitrary recipients (required for production and any multi-user testing): Resend → **Domains → Add Domain** → add 3 DNS records (SPF, DKIM, return-path) → wait ~10 min for verification.

### Bypass email entirely with the dev script

When you don't want to round-trip through email at all (e.g., scripted test logins, Resend rate trouble), use:

```bash
bun run dev:magic-link <email> [--next=/dashboard]
```

It uses the service-role key to call Supabase's admin `generateLink()` and prints a magic-link URL. Open it in the browser → land on `/dashboard`. No email sent. Service-role key required in `.env`; never run this in production CI.

## Auth flow (task-05)

The magic-link round-trip needs three things lined up:

1. **`.env`** has `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (browser uses anon key to call `signInWithOtp`).
2. **Supabase dashboard → Authentication → URL Configuration:**
   - **Site URL:** your `cloudflared` tunnel URL (changes per session unless you use a named tunnel).
   - **Redirect URLs:** add `http://localhost:3000/auth/callback` AND your tunnel URL + `/auth/callback`. Both — local origin is what the browser sees, but the tunnel URL is what Supabase expects to send mails to.
3. **No real email** wanted in dev? Disable email confirmations under Authentication → Sign In / Providers → Email; the magic link will still arrive and clicking it logs you straight in.

End-to-end check:

```bash
bun run dev                                    # in terminal 1
cloudflared tunnel --url http://localhost:3000  # in terminal 2

# Then in your browser:
#   http://localhost:3000/login → enter email → check inbox → click link
#   You land on /dashboard with "Olá, <your-email>" rendered.
```

If the link 404s with a Supabase error, the Site URL / Redirect URL pair in the dashboard is out of sync with what you submitted from the form. Fix the dashboard, request a fresh link.

For the Phase B Google OAuth flow: enable Google in Supabase → Authentication → Providers, add a Google Cloud OAuth client ID/secret, register `https://<ref>.supabase.co/auth/v1/callback` in Google Cloud, and the existing `<LoginForm />` will render a Google button when the provider is enabled (added in a follow-up commit when you've completed the dashboard side).

## Notes / gotchas

- **Never commit a `.env` with the service-role key.** It bypasses RLS.
- The hosted DB has nightly snapshots on the free tier — ADR-0001's "single
  backup story" still holds.
- Email is real on hosted (no Inbucket). For dev, prefer "Add user" with
  immediate confirm in the dashboard rather than the magic-link path.
- Free-tier projects pause after a week of inactivity. A single SQL query
  un-pauses; expect a 30s cold-start the first time.
