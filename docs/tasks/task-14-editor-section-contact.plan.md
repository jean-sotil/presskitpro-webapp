# Task 14 — Implementation Plan (RFC-Lite)

> Architectural artifact for [task-14-editor-section-contact.md](./task-14-editor-section-contact.md).
> Authored under the Maestro protocol. Length: < 300 lines (Anti-Novel Rule).

## Why

Task-14 introduces the editor's first **inbound** surface: visitors can reach the artist via WhatsApp, email, or an in-page form. Two patterns get exercised here that downstream tasks reuse:

1. **Public POST route with anti-abuse layering** — honeypot, rate-limit, captcha placeholder, validation. The shape is reused by the v2 booking inbox (task-34) and any future write-from-public surface.
2. **Adapter-shaped external integrations** — Turnstile + Resend live behind interfaces in the route handler. Without env vars they no-op and the request still completes (logs the structured payload). With env vars they activate. No new dependencies in this pass.

## Decisions locked (Socratic Gate)

| # | Axis | Decision | Rationale |
|---|---|---|---|
| 1 | Storage shape | Add 4 fields to `Profiles` (not `ProfileContent`): `contactWhatsapp`, `contactEmail`, `contactFormEnabled` (bool), `contactFormDestination` (text, defaults to `contactEmail` if blank). | Contact info is identity-level, not localized — same number/email regardless of language. Keeps the profile PATCH route the only writer. |
| 2 | Validation reuse | WhatsApp parser/validator reuses `parseAndCanonicalize('whatsapp', x)` from task-13. Email reuses the same `parseAndCanonicalize('email', x)`. The editor + the form submit route both run them. | One canonical form across the editor and the public surface; no second-source-of-truth drift. |
| 3 | Rate-limiter shape | In-memory sliding window keyed by IP, default `5 / hour` per PRD §14. Pure module (`lib/server/rate-limit.ts`) with DI for `now()` so tests are deterministic. Multi-instance limitation is documented; task-27 (RLS + rate limits) replaces with shared storage. | Spec AC. In-memory is acceptable for v1 single-process Vercel deployment; documented as task-27 follow-up. |
| 4 | Captcha + email integrations | Both are interface-shaped functions with default no-op implementations. `verifyCaptcha(token)` returns `{ ok: true }` if `TURNSTILE_SECRET_KEY` is unset (logs `[turnstile] disabled`). `sendEmail(args)` writes a structured `[contact-form] would send:` log if `RESEND_API_KEY` is unset. Both swap to live calls when env vars exist (one-line change each). | Lets us ship + test the entire pipeline today without external accounts. The user wires creds when ready — no code change needed. |
| 5 | Honeypot | Hidden `website` field. Any non-empty value → return `200 { ok: true }` immediately. Never tell the bot it was caught. | PRD AC. |
| 6 | Form storage | Don't store submissions. Relay through `sendEmail`, return 200, drop the body. | PRD note ("Don't store submissions in DB unless the v2 inbox is built; just relay"). |
| 7 | Public form a11y | Native `<form>` with `aria-invalid` on bad fields; client validates email + name + message; submit POSTs JSON; on error response, render `role="alert"`. Submit button stays disabled while pending. | PRD AC. |
| 8 | Out-of-scope reaffirmed | Booking inquiry inbox (task-34); SMS/SMTP fallback; form-builder UI. | Spec scope-out. |

## Cross-references

- PRD §6.3 (Contact section), §11 (form a11y), §14 (rate limits).
- task-08 (Profiles schema), task-09 (autosave dispatch), task-13 (`social-link-validate`), task-27 (RLS hardening + persistent rate limits), task-34 (v2 inbox).

## File inventory (deliverables)

### Schema
- `payload/collections/Profiles.ts` — add `contactWhatsapp`, `contactEmail`, `contactFormEnabled`, `contactFormDestination`.
- `migrations/<ts>_task_14_contact.{json,ts}` — generated.
- `migrations/index.ts` — register the new migration.

### Pure helpers (TDD)
- `lib/server/rate-limit.ts` (+ test) — `createRateLimiter({ windowMs, max, now })` returning `{ check(key) → { ok, retryAfterSec? } }`.
- `lib/server/contact-validate.ts` (+ test) — `validateContactForm({ name, email, message, honeypot })` → `{ ok | reason }`. Reuses `parseAndCanonicalize('email', ...)` from task-13.

### REST route
- `app/api/profiles/[id]/contact-submit/route.ts` — POST handler. Steps: honeypot first (silent 200) → rate-limit (429) → validate (400) → captcha (400) → resolve `contactFormDestination` from the profile → `sendEmail` (placeholder logs if no `RESEND_API_KEY`) → 200.

### Editor
- `app/api/profiles/[id]/route.ts` — extend `PATCHABLE_FIELDS` with the four new keys.
- `components/editor/sections/ContactEditCard.tsx` (+ test) — WhatsApp + email inputs, form-enable toggle, destination input (auto-fills from `contactEmail` until user overrides).
- `components/editor/EditorPane.tsx` — add `case 'contact'`.
- `lib/editor/sections.ts` — flip `contact.hasEditor = true`.

### Public renderer
- `components/profile/sections/ContactRender.tsx` — keep WhatsApp / email buttons. When `contactFormEnabled`, render the form below the buttons (client component for the submit handler).
- `components/profile/sections/ContactForm.tsx` (+ test) — controlled form, honeypot field, fetch POST, error/success states.

### E2E + runbook
- `tests/e2e/editor-contact.spec.ts` — `@full` happy path: edit fields → toggle form → public submit happy path → bad email blocked → honeypot silently 200s.
- `docs/runbooks/dev-editor.md` — append the contact recipe + Turnstile + Resend wire-up notes.

## Implementation sequence

1. **Schema + migration.**
2. **Pure helpers (TDD)** — `rate-limit`, `contact-validate`.
3. **REST route** — POST with placeholder integrations + tests via DI.
4. **Profile PATCH whitelist extension.**
5. **ContactEditCard (TDD).**
6. **Wire EditorPane + section flag.**
7. **ContactRender + ContactForm (TDD).**
8. **E2E + runbook.**

## Acceptance evidence (Verification Matrix)

| AC | How verified |
|---|---|
| Submissions delivered within 60s | The placeholder `sendEmail` returns synchronously; the live Resend integration is a sync `fetch`. Test asserts the route returns ok ≤ rate-limit budget. |
| Honeypot silently 200s | Route test posts a body with `website: 'spam'`, expects 200 + zero `sendEmail` calls. |
| Keyboard a11y + `aria-invalid` + `role="alert"` | ContactForm test asserts both attrs on a bad submit. |
| 429 with retry-after | Route test calls 6× in quick succession against same IP, asserts 429 with `Retry-After` header. |

## Test plan (TDD)

- **Unit:** `rate-limit` (window math + DI now), `contact-validate` (honeypot + field rules), `ContactEditCard` (whatsapp parse, form toggle, destination default), `ContactForm` (validation + post + error rendering), route handler (auth + each anti-abuse layer + email dispatch with placeholder).
- **Integration:** `ContactRender` against fixture profiles (form on/off).
- **E2E:** `@full` happy path (skip-flag gated).

## Out of scope (explicit)

- Booking inbox in dashboard — task-34.
- Persisted rate-limiter (Upstash / Postgres bucket) — task-27.
- SMS/SMTP fallback.
- New runtime dependencies (`resend`, `@marsidev/react-turnstile`, etc.) — added when env vars exist.

## Risks

- **R1 — In-memory rate limiter resets on Vercel cold-start.** A bursty bot could re-arm by triggering a deploy. *Mitigation:* documented in task-27 as the upgrade path; the captcha layer is the real defense. The rate limiter just slows hand-typed spam.
- **R2 — Placeholder `sendEmail` swallows the message.** During QA, tester thinks the form worked but the artist never receives the email. *Mitigation:* the structured log line is loud (`console.warn('[contact-form] RESEND_API_KEY unset — message not delivered:')`). Runbook calls this out; the live env wires the key.
- **R3 — `contactFormDestination` falls back to the profile owner's `Users.email`.** If the user explicitly leaves the destination blank, we do NOT email the visitor's address (which would be a confused-deputy hole). The fallback chain is `destination → contactEmail → 400 "no destination"`. Tested.
- **R4 — Captcha bypass on token replay.** Turnstile tokens are single-use server-side, but our placeholder accepts any string. *Mitigation:* documented in the runbook; the live integration calls `siteverify` which rejects replays.

## Done when

1. Migration applied; `pnpm payload generate:types` clean.
2. All pure helpers + route tests TDD green.
3. ContactEditCard saves through `applyMutation('profile', ...)`; reload preserves values.
4. Form on the public render submits → 200 with placeholder log; toggle off hides the form.
5. Honeypot + rate-limit verified via the route test.
6. `pnpm test` + `pnpm typecheck` green; e2e `@full` green when creds set.
7. Plan file (this doc) committed alongside implementation.
