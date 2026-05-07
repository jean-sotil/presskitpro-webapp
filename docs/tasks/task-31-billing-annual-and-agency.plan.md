# Task 31 — Implementation Plan (RFC-Lite)

> Architectural artifact for [task-31-billing-annual-and-agency.md](./task-31-billing-annual-and-agency.md).
> Authored under the Maestro protocol. Length: < 300 lines.

## Why

PRD §16 ships v1 with monthly Pro only. Task-31 adds annual Pro (~2 months free), an Agency tier (up to 10 profiles, single Stripe customer, profile switcher), and the proration-aware upgrade/downgrade path. Most of the scaffolding from task-22 and task-23 is in place — `PlanId = 'trial' | 'pro' | 'agency'` already exists, the pricing table already renders, and the checkout switch already has a branch for `agency_monthly`. What's missing is:

1. The `'agency'` value on the **Users.plan enum** (currently `free | pro`).
2. A **price-id → plan** reverse map so the webhook can flip `Users.plan` on subscription changes.
3. `STRIPE_PRICE_ID_AGENCY_ANNUAL` (PRD demands annual on every paid tier) and a rename of `STRIPE_PRICE_ID_AGENCY` → `..._AGENCY_MONTHLY` for symmetry.
4. A **plan-switch** route that calls Stripe `subscriptions.update` with `proration_behavior: 'create_prorations'`.
5. The **profile switcher** + **10-profile cap** + **pricing-page UI** (PR-B).

## Slice

- **PR-A (this) — Data model + plan-switch backend.** Server-only. Extends the enum, wires the reverse map, makes the webhook flip `Users.plan` on subscription changes, ships `/api/billing/switch-plan`, env vars. ~50% of the diff.
- **PR-B — UI.** Profile switcher (dashboard dropdown + cookie), 10-profile create gate (Payload access predicate + UI), pricing page Agency-annual column + toggle, translations. Lands once PR-A is verified end-to-end.

## Audit — what's already shipped

| Surface | Status | Where |
|---|---|---|
| `PlanId` enum at type level | ✅ done | [lib/pricing/plans.ts:11](../../lib/pricing/plans.ts#L11) |
| Pricing config + Stripe Price ID env mapping | ✅ done | [lib/pricing/plans.ts](../../lib/pricing/plans.ts) (agency has monthly only) |
| Checkout session creation w/ `pro_monthly` / `pro_annual` / `agency_monthly` switch | ✅ done in task-23 | [lib/billing/create-checkout-session.ts](../../lib/billing/create-checkout-session.ts) |
| Stripe webhook setting `stripeSubscriptionStatus` | ✅ done | [lib/billing/handle-stripe-webhook.ts](../../lib/billing/handle-stripe-webhook.ts) |
| `Users.stripeCustomerId` + `stripeSubscriptionId` | ✅ done | [Users.ts](../../payload/collections/Users.ts) |
| Pricing page + annual toggle component | ✅ done in task-22 | [app/pricing/page.tsx](../../app/pricing/page.tsx) |
| Trial pause cron | ✅ done in task-23 | [app/api/cron/billing/route.ts](../../app/api/cron/billing/route.ts) |

## Decisions locked (PR-A)

| # | Axis | Decision | Rationale |
|---|---|---|---|
| 1 | `Users.plan` enum | Add `'agency'` (and rename `'free'` → `'trial'` for consistency with `PlanId`). Migration is non-destructive — Payload select fields accept new values without a backfill, and existing `'free'` rows are remapped via a one-shot SQL update referenced in the runbook. | Single source of truth for the plan name across `Users`, `PlanId`, and the webhook reverse map. |
| 2 | Price-id reverse map | `priceIdToPlan(priceId): { plan: 'pro' \| 'agency', cycle: 'monthly' \| 'annual' } \| null`. Pure DI on `process.env` lookups so tests don't need real Stripe IDs. Pure module = trivially testable. | Webhook reads `subscription.items.data[0].price.id` and reverse-maps to a known plan. |
| 3 | Webhook plan flip | Extend the existing `customer.subscription.created/updated` branch in [handle-stripe-webhook.ts](../../lib/billing/handle-stripe-webhook.ts) to read the price id, call `priceIdToPlan`, and set `Users.plan` alongside the existing `stripeSubscriptionStatus`. `customer.subscription.deleted` flips back to `'trial'`. | AC #4 — within-5s update is automatic via Stripe's webhook delivery. |
| 4 | Plan-switch route | New `POST /api/billing/switch-plan` accepts `{ planKey: 'pro_monthly' \| 'pro_annual' \| 'agency_monthly' \| 'agency_annual' }`. Loads the user's existing subscription, calls `stripe.subscriptions.update({ items: [{ id, price }], proration_behavior: 'create_prorations' })`. | AC #1 — Stripe handles the proration math. |
| 5 | Env-var shape | Rename `STRIPE_PRICE_ID_AGENCY` → `STRIPE_PRICE_ID_AGENCY_MONTHLY`. Add `STRIPE_PRICE_ID_AGENCY_ANNUAL`. Keep the old name as a fallback in `priceIdToPlan` for one release so deployments don't break mid-flight. | Aliasing covers the rolling-deploy gap. The env-example documents the rename. |
| 6 | Auth on switch route | Standard Supabase session cookie via `supabaseServer().auth.getUser()` — same shape as `/api/profiles/[id]`. Returns 401 for anon, 403 if the calling user has no `stripeSubscriptionId`. | The route is per-user; no cron/admin-only path needed. |
| 7 | Pricing config — agency annual | Add `priceUSDAnnual: 33` (≈2 months free off `39`) and `stripePriceIdAnnualEnv: 'STRIPE_PRICE_ID_AGENCY_ANNUAL'` to the agency entry. The pricing page picks it up automatically via `priceForBilling`. | Feeds PR-B's pricing-page update without extra plumbing. |
| 8 | Test posture | Pure-fn tests on `priceIdToPlan` + `webhook plan-flip branch` + `switch-plan handler`. Real Stripe SDK is injected via existing `stripe-client` so the tests use a fake. | Same posture as task-23. |
| 9 | Out of scope (PR-A) | Profile switcher (cookie + dropdown), 10-profile create gate, pricing page UI updates, translations for new dashboard strings, `/api/billing/portal-link` (Stripe customer portal — separate task if needed). | All in PR-B. |

## File inventory (PR-A)

### New
- `lib/pricing/price-id-to-plan.ts` — pure reverse map; reads env to resolve.
- `lib/pricing/price-id-to-plan.test.ts` — coverage of all 4 mappings + unknown.
- `lib/billing/switch-plan.ts` — pure handler with DI on Stripe + Payload deps.
- `lib/billing/switch-plan.test.ts` — happy path, no-subscription, unknown plan, Stripe-error fallback.
- `app/api/billing/switch-plan/route.ts` — auth-gated POST, wires live deps.
- `tests/e2e/switch-plan-auth.spec.ts` — `@smoke` 401 unauth, 401 wrong session.

### Modified
- `payload/collections/Users.ts` — `plan` enum gains `'agency'`; `'free'` renamed to `'trial'` (label remains user-facing).
- `payload-types.ts` — regenerated.
- `lib/pricing/plans.ts` — agency gains `priceUSDAnnual: 33` and `stripePriceIdAnnualEnv: 'STRIPE_PRICE_ID_AGENCY_ANNUAL'`. Comment notes the rename of the monthly env var.
- `lib/billing/create-checkout-session.ts` — `agency_annual` switch branch reading the new env.
- `lib/billing/handle-stripe-webhook.ts` — uses `priceIdToPlan` to set `Users.plan` on `subscription.created/updated`; flips back to `'trial'` on `subscription.deleted`.
- `lib/billing/handle-stripe-webhook.test.ts` — coverage for the new plan-flip behavior.
- `.env.example` — `STRIPE_PRICE_ID_AGENCY` → `STRIPE_PRICE_ID_AGENCY_MONTHLY`; add `STRIPE_PRICE_ID_AGENCY_ANNUAL`.
- `docs/runbooks/dev-editor.md` — append a "Switch plans + verify proration" recipe + a one-line note on the SQL backfill from `'free'` → `'trial'` for old rows.

### Untouched (verified)
- The existing trial-pause cron — its query reads `trialEndsAt`, not `plan`, so the rename is invisible.
- The pricing page render — automatically picks up `priceUSDAnnual` from the config.
- The middleware + CSP + rate limiters.

## Implementation sequence

1. **Plan doc** (this).
2. **`priceIdToPlan` (TDD).**
3. **`Users.plan` enum extension; regenerate types.**
4. **Webhook plan-flip wiring (TDD on the dispatch table).**
5. **`agency_annual` env + plan config + checkout switch.**
6. **`switchPlan` pure handler (TDD).**
7. **`/api/billing/switch-plan` route (live deps).**
8. **`tests/e2e/switch-plan-auth.spec.ts` (`@smoke`).**
9. **Runbook recipe.**
10. **Verification (typecheck + tests + i18n:check + build + e2e + bundle:check).**

## Acceptance evidence (PR-A)

| AC | Status (PR-A) |
|---|---|
| Switching from monthly to annual prorates correctly | ✅ The `switch-plan` handler calls `stripe.subscriptions.update({ proration_behavior: 'create_prorations' })`. Unit tests verify the call shape; manual verification recipe in the runbook for end-to-end Stripe testing. |
| Agency user can create up to 10 profiles, blocked at 11 | ⏳ PR-B (Payload `Profiles.access.create` predicate). |
| Profile switcher persists last-active profile per session | ⏳ PR-B. |
| Stripe webhook plan-change events update `Users.plan` within 5s | ✅ `priceIdToPlan` + webhook branch update; tests verify the branch fires for both `pro_monthly`→`pro_annual` and `pro`→`agency`. |

ACs 2 + 3 land in PR-B; this plan covers PR-A only.

## Test plan

- **Unit:** `priceIdToPlan` for every (PRO/AGENCY × MONTHLY/ANNUAL) pair + null for unknown ids; `handleStripeWebhook` plan-flip branch (uses fake Stripe + fake Payload deps from the existing test file); `switchPlan` happy path + every refusal kind (no-subscription, unknown plan, Stripe error).
- **E2E (`@smoke`):** `/api/billing/switch-plan` returns 401 without a Supabase session cookie. Real proration testing requires a live Stripe sandbox and lives in the runbook recipe.

## Risks

- **R1 — Env-var rename breaks rolling deploy.** The renamed `STRIPE_PRICE_ID_AGENCY_MONTHLY` shipping before the env update would break agency checkouts. *Mitigation:* `priceIdToPlan` and the checkout helper accept BOTH the new and old env names; the runbook flags the rename as a one-shot deploy task.
- **R2 — Webhook stops firing on a price-id we don't know.** A Stripe-side price replacement (e.g. tax migration) would break the reverse map. *Mitigation:* `priceIdToPlan` returns `null` on unknown ids; the webhook handler logs + leaves `plan` unchanged. Better than mis-flipping.
- **R3 — Switching down (annual → monthly) charges immediately.** Stripe's default for `proration_behavior: 'create_prorations'` issues a credit/charge instantly. *Mitigation:* spec says "prorates correctly" — that's the intended behavior. The runbook recipe shows the test path so we don't surprise ourselves.
- **R4 — `Users.plan` rename from `'free'` to `'trial'`.** Any code branching on `=== 'free'` would silently drift. *Mitigation:* `git grep "=== 'free'"` shows the only consumers are the seed + the (now-renamed) Users collection; the migration note covers the old data.

## Done when (PR-A)

1. `bun run test` passes the new specs (priceIdToPlan + switchPlan + extended webhook).
2. `bun run typecheck` + `bun run i18n:check` + `bun run build` green.
3. `tests/e2e/switch-plan-auth.spec.ts` green: 401 without session.
4. The runbook records how to manually exercise an upgrade/downgrade against Stripe sandbox.
5. Plan doc (this) committed alongside implementation.

## Out of scope (PR-B + later)

- Profile switcher + cookie + editor scoping.
- 10-profile cap on `Profiles.access.create`.
- Pricing page Agency-annual column + toggle (already partially wired via `priceUSDAnnual`).
- Stripe Customer Portal link (`/api/billing/portal-link`) — separate task.
- Multi-user team accounts within an Agency (PRD §2 non-goal).
- Backfill of the legacy `'free'` plan value to `'trial'` is documented as a one-line SQL UPDATE in the runbook; we don't ship a Payload migration script for it.
