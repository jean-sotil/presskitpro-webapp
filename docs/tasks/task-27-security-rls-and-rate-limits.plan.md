# Task 27 — Implementation Plan (RFC-Lite)

> Architectural artifact for [task-27-security-rls-and-rate-limits.md](./task-27-security-rls-and-rate-limits.md).
> Authored under the Maestro protocol. Length: < 300 lines.

## Why

PRD §14 demands: zero-trust on the data plane, encrypted-at-rest secrets, rate limits on every public surface that costs money or unlocks accounts, a default-deny CSP, and minimal cookies. Most of the data-plane work landed in earlier tasks; what remains is **rate-limit infrastructure that survives serverless cold starts**, a **CSP header (report-only first)**, and the **legal + cookie consent UI**.

## Audit — what's already shipped

| Area | Status | Where |
|---|---|---|
| IG access-token AES-256-GCM encryption (beforeChange/afterRead) | ✅ done | [lib/payload/hooks/encrypt-token.ts](../../lib/payload/hooks/encrypt-token.ts), wired in [InstagramConnections.ts](../../payload/collections/InstagramConnections.ts) |
| Payload access predicates (`ownsSelf`, `ownsProfile`, `ownsViaProfile`, `canCreateForOwnedProfile`) | ✅ done | [lib/payload/access/predicates.ts](../../lib/payload/access/predicates.ts) |
| Storage RLS (avatars, gallery — public read, auth write) | ✅ done | `supabase/migrations/20260429000001_…` |
| `public.*` tables (slug_reservations, slug_redirects, analytics_*) RLS enabled, no anon policies | ✅ done | task-07 + task-24 migrations |
| `payload.*` schema not granted to anon/authenticated | ✅ default | Supabase ships with only `public` schema exposed |
| Sliding-window rate-limit primitive (in-memory) | ✅ done | [lib/server/rate-limit.ts](../../lib/server/rate-limit.ts) |
| Contact form rate limit (5/hour/IP) | ✅ done | [contact-submit-handler.ts](../../lib/server/contact-submit-handler.ts) |
| Press kit URL HEAD validation | ✅ done in task-15 | [lib/payload/hooks/derive-press-kit-provider.ts](../../lib/payload/hooks/derive-press-kit-provider.ts) — daily check is task-30 |
| Public-profile theme nonce | ❌ pending | Inline `<style>` injection in `app/[slug]/page.tsx` |

## Remaining work — sliced into 2 PRs

The original plan suggested 3 PRs (27-A/B/C). After audit, the data-plane PR (27-A) collapses to a one-file README addition; merging it into 27-B keeps reviewable diffs at two cuts:

- **PR-1 — Hardening (server)**: KV-backed rate limiter, apply to auth + slug-availability, CSP report-only header with per-request nonce, security-posture README. ~30% of the diff.
- **PR-2 — Consent + legal (UI)**: cookie consent banner, `/privacy` + `/terms` stubs, footer wiring. ~70% of the diff.

This plan covers PR-1; PR-2 gets its own RFC-Lite once PR-1 lands.

## Decisions locked (PR-1)

| # | Axis | Decision | Rationale |
|---|---|---|---|
| 1 | Rate-limit backend | Pluggable: `lib/server/rate-limit-kv.ts` adds a Vercel-KV-backed limiter behind the same `RateLimiter` interface; `createRateLimiterFromEnv()` picks KV when `KV_REST_API_URL` + `KV_REST_API_TOKEN` are set, otherwise the existing in-memory variant. Tests use in-memory. | One interface; works in dev (no KV) and in prod (KV). Vercel KV is Upstash-flavored Redis with a REST API — same primitive. |
| 2 | Window algorithm | Keep the current sliding-window timestamp queue (per-key `ZADD`/`ZREMRANGEBYSCORE` in KV). | Identical semantics to the in-memory limiter; one mental model. |
| 3 | Auth limiter scope | 5 hits / minute / IP across `/login`, `/signup`, `/auth/callback`. Apply in [middleware.ts](../../middleware.ts) before `decideRedirect` runs — limit hits the auth surface regardless of cookie state. | PRD §14. Middleware is the single funnel for auth paths. |
| 4 | Slug-availability limiter | 30 hits / minute / IP on `POST /api/slug/check`. Apply at the route handler. | PRD §14; bot-throttle on a publicly probable endpoint. |
| 5 | 429 response shape | `{ error: 'rate-limited' }` JSON body + `Retry-After: <seconds>` header for API routes; HTML response with the same header for page routes. | Mirrors existing contact-form posture; AC requires `Retry-After`. |
| 6 | CSP mode | **Report-only** for v1. `Content-Security-Policy-Report-Only` header set in [middleware.ts](../../middleware.ts) for non-API responses. AC: 7 days clean on staging before flipping to enforce — that flip is a follow-up commit. | PRD §14 + AC #2. |
| 7 | CSP allowlist | `default-src 'self'`; `script-src 'self' 'nonce-<n>' js.stripe.com`; `style-src 'self' 'nonce-<n>'`; `img-src 'self' data: blob: *.supabase.co *.cdninstagram.com *.fbcdn.net i.ytimg.com i1.sndcdn.com`; `connect-src 'self' *.supabase.co api.stripe.com`; `frame-src www.instagram.com w.soundcloud.com js.stripe.com`; `font-src 'self' data:`; `frame-ancestors 'none'`; `base-uri 'self'`; `form-action 'self'`. | Covers IG embed, SoundCloud oEmbed, Stripe Checkout, Supabase Storage, Next.js inline scripts (via nonce). |
| 8 | Nonce generation | Per-request 16-byte base64 nonce minted in middleware; passed to RSCs via the request `x-nonce` header; consumed by the inline `<style>` in `app/[slug]/page.tsx` via `headers().get('x-nonce')`. | The only inline-style site is the theme injection; everything else is in CSS files. |
| 9 | Reporting endpoint | `report-uri` omitted in v1 — Vercel logs catch the violations via the response header in browser console + Sentry (task-28) once it lands. | Avoid net-new surface; task-28 wires structured violation reporting. |
| 10 | Out of scope | CSP enforce-mode flip; Sentry CSP report ingestion; HSTS Preload submission; Subresource Integrity for third-party scripts. | Each is a separate, low-risk follow-up. |

## Cross-references

- PRD §14 (Security/privacy), §15 (Privacy: cookies), §18 risk #10 (link rot).
- task-15 (HEAD validation), task-17 (IG embed allowlist), task-23 (Stripe domains), task-24 (analytics privacy posture).

## File inventory (PR-1)

### New
- `lib/server/rate-limit-kv.ts` — KV-backed limiter, same `RateLimiter` interface.
- `lib/server/rate-limit-kv.test.ts` — diff-logic tests with a fake KV.
- `lib/server/rate-limit-from-env.ts` — env-aware factory.
- `lib/server/rate-limit-from-env.test.ts` — factory selection tests.
- `lib/security/csp.ts` — pure helper that builds the CSP header string from a nonce + env.
- `lib/security/csp.test.ts` — header-shape tests.
- `lib/security/nonce.ts` — `mintNonce()` pure helper.
- `tests/e2e/security-headers.spec.ts` — `@smoke` Playwright spec asserting CSP-RO + Retry-After.
- `docs/runbooks/security-posture.md` — short README documenting the data-plane posture (audit table above + how to add new public-table RLS).

### Modified
- `middleware.ts` — auth-path rate limit, CSP-RO header on non-API responses, `x-nonce` request header for RSCs.
- `app/api/slug/check/route.ts` — slug-availability limiter.
- `app/api/profiles/[id]/contact-submit/route.ts` — swap to `createRateLimiterFromEnv()`.
- `app/[slug]/page.tsx` — read `headers().get('x-nonce')` and pass to the inline `<style>` tag.
- `package.json` — add `@vercel/kv` dep.

### Untouched (verified)
- `lib/payload/hooks/encrypt-token.ts` and its tests — re-asserted via existing test suite.
- `lib/payload/access/predicates.ts` — unchanged; existing tests cover it.
- All `supabase/migrations/*` — no new RLS migration needed.

## Implementation sequence

1. **Plan doc** (this).
2. **`csp.ts` + `nonce.ts` (pure, TDD-first).**
3. **`rate-limit-kv.ts` + factory (TDD-first, fake KV).**
4. **Wire CSP-RO + nonce in middleware.**
5. **Wire auth-path rate limiter in middleware.**
6. **Wire slug-availability limiter in `/api/slug/check`.**
7. **Swap contact-submit to env-aware factory.**
8. **Read nonce in `app/[slug]/page.tsx` for the theme `<style>`.**
9. **`tests/e2e/security-headers.spec.ts` (`@smoke`).**
10. **`docs/runbooks/security-posture.md`.**
11. **Verification (typecheck + tests + build + e2e).**

## Acceptance evidence (PR-1)

| AC | How verified |
|---|---|
| Anon user reading another's profile via Supabase JS gets 0 results | Existing posture: `payload.*` not exposed to anon; `public.*` tables RLS-enabled with no anon policies. Documented in `security-posture.md`. |
| Rate-limit returns 429 with `Retry-After` | Unit tests on the KV limiter; e2e spec hits the slug endpoint 31× and asserts the 31st response. |
| CSP report-only deployment shows zero unexpected violations on staging for 7 days | PR-1 ships report-only; the 7-day soak + flip-to-enforce is a follow-up commit referenced in `security-posture.md`. |
| DB dump shows IG tokens as ciphertext | Existing posture verified by `encrypt-token.test.ts`. |

## Risks

- **R1 — KV outage drops the limiter open.** A KV `get`/`set` failure shouldn't deny legitimate users. *Mitigation:* the KV limiter catches and returns `{ ok: true }` on infra error (fail-open), with a console.warn so Sentry (task-28) surfaces it.
- **R2 — CSP report-only breaks something silently.** Report-only never blocks, but if we accidentally flip to enforce in a misconfigured env, theme injection breaks. *Mitigation:* explicit env gate `CSP_ENFORCE=1`; default is report-only. Runbook documents the flip ritual.
- **R3 — Nonce omitted by the inline style consumer.** If a developer adds an inline `<style>` without the nonce attribute, the report-only CSP would log a violation. In enforce mode it would break. *Mitigation:* lint rule (`no-inline-styles-without-nonce`) is overkill; one-line note in `security-posture.md` and the existing pre-commit `pnpm/bun run typecheck` catches missing types.
- **R4 — Auth-path limiter rate-limits legitimate magic-link redirects.** `/auth/callback` runs once per email click; 5/min is generous. *Mitigation:* limiter scope is per-IP, not per-route; bursts of legit callbacks share a budget across the auth surface — still well within 5/min for a single human.

## Done when (PR-1)

1. `bun run test` includes new KV-limiter, factory, CSP, and nonce specs — all green.
2. `bun run build` succeeds; no new console errors at runtime.
3. `tests/e2e/security-headers.spec.ts` green: 30 slug-checks pass, the 31st returns 429 with `Retry-After`; `/` response includes `Content-Security-Policy-Report-Only`.
4. Manually verified locally: `curl -I http://localhost:3000/marina-clube` shows the CSP-RO header; the public profile renders without console violations.
5. `docs/runbooks/security-posture.md` committed.
6. Plan file (this doc) committed alongside implementation.

## Out of scope (PR-2 will cover)

- Cookie consent banner (locale + auth cookies only).
- `/privacy` + `/terms` route stubs with placeholder PT-BR copy.
- Footer link wiring.

## Out of scope (post-task-27)

- Flipping CSP from report-only to enforce (separate commit after 7-day staging soak).
- Sentry-based CSP violation ingestion (task-28).
- HSTS Preload submission, SRI hashes for third-party scripts.
- 2FA, bug bounty (PRD scope-out).
