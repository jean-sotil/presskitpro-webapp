# Task 05 — Authentication (Email Magic Link + Google OAuth)

## Summary
Ship Supabase Auth integration covering signup, login, session persistence, and middleware-gated `/dashboard/*` routes.

## PRD references
- §6.2 (Auth & onboarding), §8 (middleware redirect), §14 (security).

## Dependencies
- task-02 (Supabase wired), task-08 (Users collection synced).

## Scope (in)
- Supabase Auth: email magic link + Google OAuth providers.
- Login page (`/login`), signup page (`/signup`), magic-link landing.
- Next.js middleware reads Supabase session cookie; unauthenticated requests to `/dashboard/*` or `/admin/*` redirect to `/login?next=…`.
- Logout endpoint clears the session cookie and revokes the refresh token.
- Sync-on-create webhook upserts a Payload `Users` doc on first login.
- Rate limit on `/api/auth/*` (per §14).

## Scope (out)
- Apple/Facebook providers (deferred per PRD).
- 2FA (deferred for end users; admin-only mention in §14).

## Acceptance criteria
- [ ] Magic link round-trip works in <60s from email send.
- [ ] Google OAuth redirect lands the user back at `next` if provided, else `/dashboard`.
- [ ] Session persists across page reloads but expires per Supabase default (7d sliding).
- [ ] Logged-out access to `/dashboard` 302s to `/login?next=/dashboard`.
- [ ] Rate limit returns 429 after 5 attempts/min on the same IP.

## Implementation notes
- Use Supabase's `@supabase/ssr` package for cookie handling — required for App Router.
- Avoid client-only auth checks for protected pages; always verify on the server.
- The `next` param must be allowlisted (relative URLs only) to prevent open-redirect.

## Status

**Phase A complete (magic link).** Phase B (Google OAuth) and Phase C (custom rate limit) deferred — see [the plan](./task-05-auth-supabase.plan.md) for pre-conditions.

| AC | State | Notes |
|---|---|---|
| Magic link round-trip < 60s | 🟡 manual | Verified via the [auth flow runbook section](../runbooks/dev-hosted-supabase.md#auth-flow-task-05). CI doesn't traverse real email. |
| Google OAuth `next` redirect | 🚧 deferred Phase B | Operator: enable provider in Supabase dashboard + create Google Cloud OAuth client. |
| Session persists across reloads | ✅ | `@supabase/ssr` session cookies; default 7d sliding. |
| Logged-out `/dashboard` → 302 `/login?next=/dashboard` | ✅ | Verified by Playwright spec; pure logic also unit-tested in `lib/auth/decide-redirect.test.ts`. |
| 429 after 5/min/IP on `/api/auth/*` | 🚧 deferred Phase C | Lean on Supabase's built-in `sign_in_sign_ups: 30/5min/IP` for now. |

**Side fix:** `--text-muted` was at OKLCH L=0.515 → only 3.67:1 against the dark bg. Bumped to L=0.620 (5.67:1, safe margin) and extended `pnpm contrast:check` to gate text-muted vs default bg so this can never regress silently.

## Definition of Done
Per Appendix C; Phase A artifacts (auth pages, callback/logout handlers, middleware, dashboard placeholder, e2e spec, runbook section) committed alongside the plan.
