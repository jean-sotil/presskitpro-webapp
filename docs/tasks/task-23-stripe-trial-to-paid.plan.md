# Task 23 — Implementation Plan (RFC-Lite)

> Architectural artifact for [task-23-stripe-trial-to-paid.md](./task-23-stripe-trial-to-paid.md).
> Authored under the Maestro protocol. Length: < 300 lines.

## Why

Task-23 is the product's first **inbound write from a third party** (Stripe webhooks) and the first **scheduled job** (trial-pause cron). Three patterns get exercised here that downstream tasks (annual + agency in task-31, slug reclamation in task-32, paused state in task-19) reuse:

1. **Lazy Stripe Customer.** No upfront `stripe.customers.create` on signup — that would force every account onto Stripe's dashboard. Customer is created at first checkout attempt and the id is stored on `Users.stripeCustomerId`. Trial timer lives in our DB (`Users.trialEndsAt`), not Stripe — we own the no-card UX.
2. **DI-shaped webhook handler.** `handleStripeWebhook({ event, deps })` is pure. The route signature-verifies, parses, then calls the handler. Tests cover every event path without the SDK; signature verification has its own test.
3. **Idempotent event log.** Stripe retries webhooks; same `event.id` lands twice or thrice. `StripeWebhookEvents` collection holds the processed ids — second arrivals short-circuit.

## Decisions locked

| # | Axis | Decision | Rationale |
|---|---|---|---|
| 1 | Trial timer source | `Users.trialEndsAt` is the source of truth. Set on first profile creation by an `afterChange` hook on `Profiles`. Stripe doesn't know about the trial. | Spec note. Lets us run "no card required" trial without Stripe involvement. |
| 2 | Customer lifecycle | `Users.stripeCustomerId` is null until the user clicks "Continuar para o checkout seguro". The server action creates the customer + checkout session in one shot. | PRD §16 ("card required at conversion to paid"). |
| 3 | Subscription mirror | Mirror just enough from Stripe to make routing decisions: `Users.stripeSubscriptionId`, `Users.stripeSubscriptionStatus` ('active' | 'past_due' | 'canceled' | null). Not the full subscription object — that lives in Stripe. | Single-purpose; webhook is the only writer. |
| 4 | Profile `paused` state | New status enum value. Set by the cron (trial expired) or webhook (subscription canceled). Public route returns the paused template (200 OK), not 404. | Spec AC + PRD §16 ("preserves any inbound links"). |
| 5 | Webhook handler | DI'd pure function `handleStripeWebhook({ event, deps })` returning `{ kind: 'handled' | 'ignored' | 'duplicate' }`. Route does signature verification + idempotency check before calling. | Testable without the Stripe SDK; idempotency via `StripeWebhookEvents` collection. |
| 6 | Events handled | `checkout.session.completed` (mark user paid), `customer.subscription.deleted` (downgrade + pause profile), `invoice.payment_failed` (set status `past_due`; Stripe retries; only after smart-retry exhaustion does it fire `subscription.deleted` which pauses the profile). Anything else: ignore. | Spec scope. |
| 7 | Cron | `POST /api/cron/billing` — single endpoint, two effects: (a) pause profiles whose `trialEndsAt < now()` and `stripeSubscriptionStatus !== 'active'`, (b) day-12 reminder (logs to console, sends via Resend when configured). Auth via `CRON_SECRET` header. | Hourly cadence in prod; manually curl-able in dev. Single endpoint keeps the deployment surface small. |
| 8 | Checkout entry route shape | Confirmation card + server action (Surface 1B from the UX walk). User clicks "Continuar" → server action creates session → `redirect(session.url)`. | Trust framing + cleaner Stripe dashboard (no abandoned sessions from accidental clicks). |
| 9 | Stripe SDK | `stripe` npm package, lazy import in `lib/billing/stripe-client.ts`. SDK never loads in routes that don't need it (no marketing-page bundle bloat). | Standard pattern. |
| 10 | Out of scope | Annual + Agency Stripe Price IDs (task-31). Live Resend reminder emails (Day-12 logs the body until `RESEND_API_KEY` is set; reuses task-14's posture). Day-90 slug reclamation (task-32). | Spec scope-out. |

## Cross-references

- PRD §16 (Pricing & monetization), §18 risk #9.
- task-05 (Supabase auth + Users mirror), task-08 (schema), task-14 (Resend posture for placeholder emails), task-19 (paused state on public route), task-22 (pricing CTAs target `/checkout/[planId]`), task-31 (annual + agency), task-32 (slug reclamation).

## File inventory

### Schema
- `payload/collections/Users.ts` — add `stripeCustomerId`, `stripeSubscriptionId`, `stripeSubscriptionStatus`.
- `payload/collections/Profiles.ts` — add `'paused'` to status enum.
- `payload/collections/StripeWebhookEvents.ts` — new collection (idempotency log).
- `payload.config.ts` — register the new collection.
- `migrations/<ts>_task_23_billing.{ts,json}` — generated.

### Pure helpers (TDD)
- `lib/billing/trial-status.ts` (+ test) — `getTrialStatus({ user, now })` → `{ kind, daysRemaining }`.
- `lib/billing/handle-stripe-webhook.ts` (+ test) — DI'd dispatch.
- `lib/billing/pause-expired-trials.ts` (+ test) — DI'd cron logic.

### Server-only
- `lib/billing/stripe-client.ts` — lazy SDK init.
- `lib/billing/create-checkout-session.ts` — server-only helper called by the server action.

### Hooks
- `lib/payload/hooks/start-trial-timer.ts` (+ test) — `afterChange` on Profiles. Sets `Users.trialEndsAt = now + 14d` on first profile create when user has no timer.

### Routes
- `app/checkout/[planId]/page.tsx` — confirmation card + server action import.
- `app/checkout/[planId]/actions.ts` — `'use server'` action.
- `app/checkout/success/page.tsx` — confirmation page.
- `app/checkout/canceled/page.tsx` — recovery page.
- `app/api/webhooks/stripe/route.ts` — POST handler with signature verification.
- `app/api/cron/billing/route.ts` — POST endpoint gated by `CRON_SECRET`.

### Public route
- `app/[slug]/page.tsx` — branch: `paused` profiles render the paused template (200 OK).
- `components/profile/PausedTemplate.tsx` — branded "Press kit pausado" template.

### Dashboard
- `app/dashboard/TrialBanner.tsx` — countdown + CTA when `kind === 'active'`; warning state in last 2 days.

### Env
- `.env.example` — `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `CRON_SECRET`, `STRIPE_BILLING_PORTAL_RETURN_URL`.

### E2E + runbook
- `tests/e2e/checkout-flow.spec.ts` — confirmation card → cancel returns to /pricing path.
- `docs/runbooks/dev-editor.md` — append the billing recipe + Stripe CLI smoke recipe.

## Implementation sequence

1. **Plan doc** (this).
2. **Schema** + migration.
3. **`stripe` dep** + .env.example.
4. **Pure helpers (TDD)** — trial-status, handle-stripe-webhook, pause-expired-trials.
5. **`start-trial-timer` afterChange hook (TDD).**
6. **Stripe client + create-checkout-session.**
7. **Routes** — `/checkout/[planId]` + actions, `/checkout/success`, `/checkout/canceled`.
8. **Webhook route** with signature verification.
9. **Cron route** with `CRON_SECRET` gate.
10. **Public route paused branch** + `PausedTemplate`.
11. **Dashboard trial banner.**
12. **E2E + runbook + workspace log.**
13. **Verification (typecheck + suite).**

## Acceptance evidence

| AC | How verified |
|---|---|
| Day-7 conversion keeps slug + profile state | The webhook only flips `Users.plan = 'pro'` and stores subscription ids — never touches `Profiles.status` or `slug`. Tested in `handle-stripe-webhook.test.ts`. |
| Lapsed trial shows "paused" page (200 OK) | Cron unit test asserts `Profiles.status` flips to `'paused'`; route test asserts the paused template returns 200. |
| Failed payment after smart-retry pauses + emails | `customer.subscription.deleted` is the terminal event Stripe fires after retry exhaustion. Handler downgrades + pauses + queues an email log line. Tested. |
| Webhook signature verified; replays idempotent | Route test asserts a tampered signature returns 400. Handler test asserts second arrival of the same `event.id` returns `{ kind: 'duplicate' }` and is a no-op. |

## Test plan

- **Unit:** `getTrialStatus` (pre-trial / active / expired / paid), `handleStripeWebhook` (each event type + duplicate + ignored), `pauseExpiredTrials` (no-op when none, batch flips + email logs), `startTrialTimer` (sets timer on first create, no-op on later creates).
- **E2E:** `@full` happy path — visit `/checkout/pro` while logged in, confirm card renders, click "Voltar" returns to `/pricing`. (Live Stripe redirect is gated behind env vars; `@full` test only runs with `STRIPE_SECRET_KEY` set.)

## Out of scope

- Annual + Agency tiers (task-31).
- Live Resend Day-12 email (logs only until `RESEND_API_KEY` set; same posture as task-14).
- Day-90 slug reclamation (task-32).
- Stripe Customer Portal link in dashboard — included as a placeholder; full polish in task-31.

## Risks

- **R1 — Webhook fired before checkout.session.completed lands in our DB.** Stripe occasionally fires `customer.subscription.created` first. *Mitigation:* the handler matches on `customer` id (already stored from session creation); if no `Users` row matches yet, we log and 200 the webhook (Stripe retries are fine; subsequent `checkout.session.completed` resolves). Idempotency log prevents duplicates.
- **R2 — Cron runs while Stripe webhooks are mid-flight.** Race: trial expired + checkout completed in the same minute. *Mitigation:* the cron only pauses users whose `stripeSubscriptionStatus !== 'active'`. The webhook is the only writer of that status; once it lands, the cron is a no-op for that user.
- **R3 — `STRIPE_SECRET_KEY` missing in dev.** The `/checkout/[planId]` action throws on Stripe SDK init. *Mitigation:* the server action returns a friendly error string; the page surfaces "[dev] Stripe não configurado" — same posture as Resend in task-14.
- **R4 — Webhook secret rotation.** Per-environment secrets stored in env. *Mitigation:* documented in the runbook; the handler refuses any event without a verified signature.

## Done when

1. Schema migration applied; types regen clean.
2. Pure helpers TDD green.
3. `/checkout/pro` renders the confirmation card; "Voltar" returns to /pricing.
4. Webhook route returns 400 on bad signature, 200 on valid (idempotent).
5. Cron route returns 401 without `CRON_SECRET`, runs the pause + reminder logic with it.
6. Paused profile renders the branded template at `/<slug>` with HTTP 200.
7. Dashboard shows the trial banner with the right copy in each phase.
8. `pnpm test` + `pnpm typecheck` green; e2e `@full` green when Stripe credentials set.
9. Plan file (this doc) committed alongside implementation.
