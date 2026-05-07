# Security posture (task-27)

This document is the canonical reference for the data-plane and edge security guarantees PressKit.pro ships with. PRs that touch `supabase/migrations/`, `payload/collections/`, `middleware.ts`, or any `/api/*` route should re-read it.

## Data plane

| Surface | Rule | Where |
|---|---|---|
| `payload.*` schema | Not exposed to Supabase `anon`/`authenticated` roles. Service role only. | Supabase default — no `grant usage` ever issued. |
| `public.slug_reservations`, `public.slug_redirects` | RLS enabled; **no anon policy**. All reads/writes go through the service-role server key. | `supabase/migrations/20260504000001_*` |
| `public.analytics_events`, `public.analytics_daily_rollups`, `public.analytics_salts` | RLS enabled; **no anon policy**. Writes via `/api/track` (service role); reads via the dashboard route handler (also service role). | `supabase/migrations/20260506000001_*` |
| Storage `avatars/*`, `gallery/*` | RLS policies: public read, authenticated write only on the user's own folder. | `supabase/migrations/20260429000001_*` |
| `InstagramConnections.accessToken` | AES-256-GCM at rest. Encrypts in `beforeChange`, decrypts in `afterRead`. Never logged. Idempotent on re-save. | [`lib/payload/hooks/encrypt-token.ts`](../../lib/payload/hooks/encrypt-token.ts) — key in `INSTAGRAM_TOKEN_ENCRYPTION_KEY`. |
| Payload collection access | Profile-scoped collections gate reads/writes via `ownsViaProfile` / `canCreateForOwnedProfile`. Admins (`req.user.collection === 'admins'`) bypass. | [`lib/payload/access/predicates.ts`](../../lib/payload/access/predicates.ts) |

### Adding a new public table

1. Write the migration. Always end with: `alter table public.<name> enable row level security;`
2. **Do not** add an anon-readable policy unless the data is intentionally public (storage buckets are the existing exception).
3. Read paths go through the service-role server client (`supabaseAdmin()`), never `supabaseServer()` from the browser.

### Verifying anon lockdown

```bash
# Should return [] regardless of the slug.
curl "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/slug_reservations?slug=eq.demo" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY"
```

If a 200 response with a non-empty array comes back, an anon policy slipped in — revoke it.

## Rate limits

Sliding-window per-IP. KV-backed in production (`KV_REST_API_URL` + `KV_REST_API_TOKEN`); in-memory fallback in dev.

| Surface | Budget | Code |
|---|---|---|
| `/login`, `/signup`, `/auth/callback` | 5 / minute / IP | [`middleware.ts`](../../middleware.ts) |
| `GET /api/slug/check` | 30 / minute / IP | [`app/api/slug/check/route.ts`](../../app/api/slug/check/route.ts) |
| `POST /api/profiles/:id/contact-submit` | 5 / hour / IP | [`app/api/profiles/[id]/contact-submit/route.ts`](../../app/api/profiles/[id]/contact-submit/route.ts) |

429 responses always include a `Retry-After: <seconds>` header. The KV adapter fails open (allows traffic) on any backend error and `console.warn`s — denying real users on infra hiccups is worse than briefly losing the budget. Sentry (task-28) ingests the warning.

### Adding a new limiter

```ts
import { createRateLimiterFromEnv } from '@/lib/server/rate-limit-from-env';

const limiter = createRateLimiterFromEnv({
  windowMs: 60_000,
  max: 10,
  prefix: 'rl:my-endpoint',
});

const r = await limiter.check(clientIp(req));
if (!r.ok) return new Response('rate-limited', {
  status: 429,
  headers: { 'Retry-After': String(r.retryAfterSec) },
});
```

Use a unique `prefix` per logical surface — Vercel KV is shared, so collisions silently merge budgets.

## CSP

The middleware sets a per-request CSP header on every non-API response. The directive list is in [`lib/security/csp.ts`](../../lib/security/csp.ts). Mode is controlled by `CSP_ENFORCE`:

- **default (unset / not `1`)**: `Content-Security-Policy-Report-Only`. The browser logs violations to the console but doesn't block.
- **`CSP_ENFORCE=1`**: `Content-Security-Policy`. Browser blocks violations.

### Soak before flipping

The plan is a 7-day staging soak in report-only with zero unexpected violations before flipping to enforce. The flip is a one-line `CSP_ENFORCE=1` env change in Vercel — no code changes needed.

### Inline-style nonce checklist

Every inline `<style>` or `<script>` we author must carry the nonce. Today the only ones are:

1. [`components/profile/ProfileRenderer.tsx`](../../components/profile/ProfileRenderer.tsx) — theme `<style>`. Nonce passed via the `nonce` prop. Public route reads it from `headers().get('x-nonce')`.
2. [`app/[slug]/page.tsx`](../../app/[slug]/page.tsx) — JSON-LD `<script>`. Nonce read from headers.

Next.js itself emits inline RSC payload scripts; setting `x-nonce` in the request header (done by middleware) makes Next.js apply the nonce to those automatically.

**Open follow-up before flipping enforce:** the editor preview pane mounts `ProfileRenderer` from a client component (`PreviewPane`). The nonce is currently NOT threaded through the editor route. In report-only mode this only generates console violations; in enforce mode the dashboard preview's theme would not apply. Thread `nonce` from `app/dashboard/profile/[id]/page.tsx` → `EditorClient` → `PreviewPane` before flipping `CSP_ENFORCE=1`.

## Encryption keys

| Key | Purpose | Where set |
|---|---|---|
| `INSTAGRAM_TOKEN_ENCRYPTION_KEY` | AES-256-GCM key for IG access tokens. Generated via `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`. | Vercel project env, all deployments. Rotation requires a backfill: read every encrypted row with the old key, re-encrypt with the new. Not yet automated. |

## Out of scope (planned follow-ups)

- 2FA for end-users (admins-only consideration; PRD §14 scope-out).
- Bug bounty (PRD scope-out).
- Subresource Integrity for third-party scripts.
- HSTS Preload submission.
- Sentry-based CSP violation ingestion (task-28).
- Cookie consent banner + `/privacy` + `/terms` routes (task-27 PR-2).
