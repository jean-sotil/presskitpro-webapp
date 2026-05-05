# Task 05 — Implementation Plan (RFC-Lite)

> Architectural artifact for [task-05-auth-supabase.md](./task-05-auth-supabase.md).
> Authored under the Maestro protocol. Length: < 300 lines (Anti-Novel Rule).

## Why

Auth is the gate for everything in the dashboard. Supabase Auth is canonical (per [ADR-0001](../decisions/0001-payload-supabase-split.md)); this task wires Next.js App Router to it: login page → magic link → callback → middleware-gated `/dashboard`. The auth.users → Payload `Users` mirror already works (task-02 spike), so this task lives entirely on the app/middleware side.

## Decisions locked (Socratic Gate)

| # | Axis | Decision | Rationale |
|---|---|---|---|
| 1 | Auth scope this task | **Phase A: email magic link only.** Google OAuth deferred (Phase B). Custom rate limit deferred (Phase C). | Magic link is fully self-contained; Google needs operator dashboard work; rate-limiter needs vendor decision. |
| 2 | Rate limit | **Defer.** Lean on Supabase's built-in `sign_in_sign_ups: 30 / 5min / IP` for now. | PRD §14 doesn't set a deadline; adding Upstash now is premature. |
| 3 | `/dashboard` | **Placeholder** — "Welcome, {email}" + logout. | Real dashboard is task-09. |
| 4 | Server vs client checks | **Layered:** middleware redirects → server-component verifies session → client only reads for UI niceties. | Per implementation note "Avoid client-only auth checks." |
| 5 | Form library | **Hand-rolled** | Single-input `<input type="email">` form; library is overkill. |
| 6 | TDD coverage | Unit: `next` allowlist + middleware redirect decisions. E2E: form renders, submit shows "check your email", axe-clean. End-to-end magic-link verified manually (real email). | Real email round-trip is hard to assert in CI. |

## Cross-references

- PRD §6.2 — methods, onboarding wizard sequence (lands in task-06).
- PRD §8 — middleware redirect, RSC for public pages, Supabase JS for browser+server.
- PRD §14 — rate limiting (deferred), session cookies.
- ADR-0001 — Supabase Auth canonical; Payload `Users` is a mirror; webhook already shipped.
- Existing assets: [`lib/supabase/admin.ts`](../../lib/supabase/admin.ts) (service role), [`lib/supabase/browser.ts`](../../lib/supabase/browser.ts), [`app/api/webhooks/supabase-auth/route.ts`](../../app/api/webhooks/supabase-auth/route.ts).

## File inventory (deliverables)

### Server-side Supabase client (new)

- `lib/supabase/server.ts` — `supabaseServer()` using `@supabase/ssr` `createServerClient` with Next.js `cookies()` adapter. Used in route handlers, server components, and middleware. Caches per-request via React `cache()`.

### Auth helpers (new — pure, testable)

- `lib/auth/next-param.ts` — `safeNext(input: string | null | undefined, fallback = '/dashboard'): string`. Allows only relative paths starting with `/` and not `//` (protocol-relative); rejects everything else. Open-redirect defense.
- `lib/auth/next-param.test.ts` — unit fixtures for safe/unsafe inputs.
- `lib/auth/decide-redirect.ts` — `decideRedirect({ pathname, hasSession, currentNext }): RedirectDecision`. Pure function from request shape → `{ kind: 'allow' | 'redirect', to?: string }`. Centralizes middleware logic so it's testable without spinning up Next.
- `lib/auth/decide-redirect.test.ts` — table-driven tests covering: anon→`/dashboard` redirects, anon→`/admin` redirects, anon→`/login` allowed, signed-in→`/login` redirects to `/dashboard` (or `next`), signed-in→public allowed.

### Middleware

- `middleware.ts` (root) — calls `supabaseServer()` to read cookies, asks `decideRedirect`, applies `NextResponse.redirect()`. Matches `/dashboard/:path*`, `/admin/:path*`, `/login`, `/signup`. Excludes `/api`, `/_next`, static files via the `matcher` config.

### Pages

- `app/login/page.tsx` — server component; reads `next` query param, sanitizes via `safeNext`, renders `<LoginForm next={…} />`. SEO meta: `noindex`.
- `app/login/login-form.tsx` — `'use client'`. Single email input + submit. Calls `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: '<origin>/auth/callback?next=...' } })`. State machine: `idle | sending | sent | error`.
- `app/signup/page.tsx` + `app/signup/signup-form.tsx` — same flow as login; copy differs ("Create your press kit"). Same magic-link mechanic — Supabase Auth treats first-time emails as signups automatically.
- `app/dashboard/layout.tsx` — server component; calls `supabaseServer().auth.getUser()`. If no user, redirects to `/login?next=/dashboard`. Wraps the dashboard with this guard so every nested page inherits it.
- `app/dashboard/page.tsx` — placeholder: "Welcome, {email}" + logout button (form posts to `/auth/logout`). Replaced in task-09.

### Route handlers

- `app/auth/callback/route.ts` — `GET`. Reads `code` + `next` from URL. Calls `supabase.auth.exchangeCodeForSession(code)`. On success, `NextResponse.redirect(safeNext(next))`. On error, redirects to `/login?error=callback_failed`.
- `app/auth/logout/route.ts` — `POST`. Calls `supabase.auth.signOut()`. Redirects to `/`. Uses POST + same-origin form to avoid CSRF; SameSite=Lax cookies block cross-origin attempts.

### Tests

- `lib/auth/next-param.test.ts` — relative ok; `//evil.com`, `https://evil.com`, `javascript:`, empty, undefined → fallback.
- `lib/auth/decide-redirect.test.ts` — 8 scenarios (anon vs auth × public/protected/login/signup).
- `tests/e2e/auth.spec.ts` — Playwright:
  1. `/login` renders, has heading + email input + submit, axe-clean.
  2. Submitting a valid email shows "check your email" state (we stub the network call via Playwright `route()` to avoid hitting Supabase).
  3. Anon visit to `/dashboard` redirects to `/login?next=/dashboard`.

### Docs

- Add a "Auth flow" section to `docs/runbooks/dev-hosted-supabase.md` — how the magic-link round-trip works locally with `cloudflared`, what to set in Supabase dashboard (Site URL + redirect URLs).

## Implementation sequence

1. **Server client + auth helpers (TDD).** Write `next-param.test.ts` → fail; write `next-param.ts` → green. Same for `decide-redirect`.
2. **Middleware.** Wire `decideRedirect` into `middleware.ts`. Manual verification: visit `/dashboard` while logged out → redirects to `/login?next=/dashboard`.
3. **Login page + form.** Server shell + client form. Apply design-system primitives (`Button`, `Section`, `Anchor`).
4. **Callback handler.** Exchange code → set cookies → redirect to `safeNext(next)`.
5. **Signup page** — clone of login with different copy.
6. **Dashboard placeholder + logout handler.**
7. **E2E spec.** Renders + redirect + form-submit (network-stubbed).
8. **Docs.** Append auth section to dev runbook.
9. **Verify.** typecheck + lint + test + test:e2e + contrast all green.

## Acceptance evidence (Verification Matrix)

| AC (from task) | Status | How to verify |
|---|---|---|
| Magic link round-trip < 60s | 🟡 manual | Run `bun run dev` + cloudflared; submit email; click link in inbox; lands on `/dashboard`. CI doesn't traverse this. |
| Google OAuth `next` redirect | 🚧 deferred Phase B | n/a |
| Session persists across reloads (7d default) | ✅ | `@supabase/ssr` writes `sb-*` cookies with Supabase's defaults. Manual reload confirms. |
| Logged-out `/dashboard` → 302 `/login?next=/dashboard` | ✅ | Playwright spec #3. |
| 429 after 5/min/IP on `/api/auth/*` | 🚧 deferred Phase C | n/a; Supabase Auth's own limit applies. |

## Test plan (TDD)

- **Pure unit (Vitest):** `safeNext`, `decideRedirect`. Both fully testable as data → data, no React, no I/O.
- **Component (Vitest + RTL):** none for this task — login form's only logic is "send email then show success", which is more meaningful as an e2e check.
- **E2E (Playwright):** auth.spec.ts as above. Network stubbed for `auth.signInWithOtp` so the test asserts UI behavior without sending real email.

## Out of scope (explicit)

- **Onboarding wizard** — task-06; this task lands the user at `/dashboard` and stops there.
- **Google OAuth** — Phase B follow-up:
  1. Operator: Google Cloud Console → OAuth client → add redirect `https://<ref>.supabase.co/auth/v1/callback`.
  2. Operator: Supabase dashboard → Auth → Providers → Google → enable + paste client id/secret.
  3. Code: add `<GoogleSignInButton />` in login/signup forms calling `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: '/auth/callback?next=…' } })`.
- **Custom rate limit** — Phase C; needs vendor pick (Upstash vs hand-rolled).
- **2FA / Apple / Facebook** — deferred per PRD.
- **Account settings UI** — task-33 (LGPD export/delete).

## Risks

- **R1 — `@supabase/ssr` cookie integration in middleware.** Subtle: the `cookies` adapter must mutate the response, not just read the request. *Mitigation:* follow the official Next 15 example pattern; test by signing in and confirming the session survives a refresh.
- **R2 — `next` open-redirect.** Easy to get wrong. *Mitigation:* `safeNext` is a pure function with table-driven unit tests covering known attack vectors.
- **R3 — Supabase Site URL misconfig.** If the hosted project's Site URL ≠ our cloudflared tunnel, the magic link points at the wrong host. *Mitigation:* runbook step explicitly tells the operator to update Site URL to the tunnel URL each session, or use a stable named tunnel.
- **R4 — CI can't verify the email round-trip.** Documented; manual QA only for the actual link click. The Playwright spec stubs the network so CI still asserts UI behavior end-to-end.

## Done when

1. All ACs above are green or have an explicit Phase B/C deferral with a tracked operator step.
2. Unit + e2e + contrast + lint + typecheck all green locally and in CI.
3. Manual magic-link round-trip verified once (you click an email, hit `/dashboard`, see "Welcome, {email}").
4. Plan file (this doc) committed alongside implementation.
