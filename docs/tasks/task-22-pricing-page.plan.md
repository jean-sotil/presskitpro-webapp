# Task 22 — Implementation Plan (RFC-Lite)

> Architectural artifact for [task-22-pricing-page.md](./task-22-pricing-page.md).
> Authored under the Maestro protocol. Length: < 300 lines.

## Why

The pricing page is the **commercial gate** between marketing and Stripe. Three patterns get exercised here that downstream tasks (Stripe checkout in task-23, annual + agency rollout in task-31) reuse:

1. **Single-source price config.** `lib/pricing/plans.ts` exports tier metadata (display price, "includes" list, Stripe Price ID env-var name). Display values live next to the Stripe IDs so they can never drift. Task-23 reads the same module to build Stripe Checkout sessions.
2. **Auth-aware CTA.** The Pro/Agency CTAs route through `/login?next=/checkout/...` when logged-out, or directly to `/checkout/...` when logged-in. Server-side session check via `supabaseServer()` — no client JS needed.
3. **Translatable copy** keyed alongside marketing strings. Task-29 picks up both the marketing landing and pricing in a single pass.

## Decisions locked

| # | Axis | Decision | Rationale |
|---|---|---|---|
| 1 | Price config shape | `plans.ts` exports `PLANS: PlanConfig[]`. Each entry has `id`, `priceUSD` (display), `priceUSDAnnual` (display), `stripePriceIdEnv` (env var name), `includes: string[]`, `ctaHref`, `featured?: boolean`. | One module owns the whole thing. The Stripe IDs are env-driven so dev/prod don't share keys. |
| 2 | CTA routing | Pro/Agency hrefs computed server-side: `loggedIn ? /checkout/${id} : /login?next=/checkout/${id}`. Trial CTA always points to `/signup`. | Spec AC verbatim. Server-side check stays out of the client bundle. |
| 3 | Annual toggle | Client-only toggle that swaps the displayed Pro price between monthly and annual values. CTA href stays on monthly until task-31 wires both Stripe Price IDs. UI placeholder only — explicitly called out in the runbook. | Spec note ("UI placeholder exists in v1"). |
| 4 | Currency | USD across the page. PRD §16 explicitly: "pricing page itself ships in USD initially, BRL conversion in v2 if needed." | Spec scope-out. |
| 5 | Copy | New file `lib/marketing/pricing-copy.ts` (peer of `marketing/copy.ts`) with the three-tier strings + billing FAQ items. Same shape — task-29 swaps to next-intl in one pass. | Consistency with task-21. |
| 6 | Pricing FAQ | Native `<details>` accordion (same as marketing). 4 items: refund policy, cancellation, what-if-I-don't-convert, custom domains. | Spec scope (refunds, cancellations, grace logic, custom-domain reaffirmation). |
| 7 | Layout | Three-column grid on `md+`, stacked on mobile. Pro tier is `featured: true` and gets the accent border + "Mais escolhido" eyebrow. | Standard pricing-page convention. |
| 8 | Out of scope | BRL localization (v2). Live Stripe checkout (task-23). Annual Pro Stripe Price ID + Agency tier wiring beyond display (task-31). | Spec scope-out. |

## Cross-references

- PRD §16 (Pricing), §6.1 (links from marketing).
- task-03 (design tokens), task-21 (marketing landing — pricing teaser links here), task-23 (Stripe checkout), task-29 (locale toggle), task-31 (annual + agency).

## File inventory

### Pricing config (TDD)
- `lib/pricing/plans.ts` (+ test) — `PLANS`, `getPlan(id)`, `priceForBilling(plan, cycle)`.

### Centralized copy
- `lib/marketing/pricing-copy.ts` — all visible pricing strings.

### Components
- `app/pricing/PricingTable.tsx` — server component composing the three tiers.
- `app/pricing/AnnualToggle.tsx` (client) — monthly/annual switch.
- `app/pricing/PricingFaq.tsx` — `<details>` accordion (server-rendered).

### Page
- `app/pricing/page.tsx` — server component, reads session, threads logged-in flag down.

### Env
- `.env.example` — placeholders for `STRIPE_PRICE_ID_PRO_MONTHLY`, `STRIPE_PRICE_ID_PRO_ANNUAL`, `STRIPE_PRICE_ID_AGENCY`.

### E2E + runbook
- `tests/e2e/pricing.spec.ts` — `@full` happy path: visit `/pricing`, click Pro CTA logged-out → lands on `/login?next=/checkout/pro-monthly`.
- `docs/runbooks/dev-editor.md` — append the pricing recipe + 404-until-task-23 caveat.

## Implementation sequence

1. **Plan doc** (this).
2. **`plans.ts` (TDD)** + .env.example placeholders.
3. **Copy** in `pricing-copy.ts`.
4. **Components** — `PricingTable`, `AnnualToggle`, `PricingFaq`.
5. **Page** with auth-aware CTAs.
6. **E2E + runbook + workspace log.**
7. **Verification (typecheck + suite).**

## Acceptance evidence

| AC | How verified |
|---|---|
| All copy translatable | Every visible string sourced from `pricing-copy`; the file is the single source of truth. |
| Logged-out CTA on Pro routes through `/login?next=/checkout/pro-monthly` | Server-side session check returns null → CTA href is `/login?next=/checkout/pro-monthly`. E2E asserts. |
| Lighthouse Perf ≥ 95 | Server-rendered, near-zero JS, native accordion. Task-26 enforces. |

## Test plan

- **Unit:** `getPlan(id)`, `priceForBilling(plan, cycle)`. `AnnualToggle` swap behavior.
- **E2E:** `@full` happy path — logged-out user clicks Pro CTA → redirects to `/login?next=/checkout/pro-monthly`.

## Out of scope

- BRL conversion — v2.
- Live Stripe checkout — task-23 owns the `/checkout/*` routes.
- Annual Pro Stripe Price ID wiring beyond UI placeholder — task-31.

## Risks

- **R1 — `/checkout/*` 404s today.** The pricing CTAs point at routes that don't exist until task-23. *Mitigation:* documented in the runbook. Logged-out flow correctly reaches `/login?next=/checkout/...` which then 404s post-login — acceptable until task-23 lands.
- **R2 — Annual price drift.** The toggle swaps displayed values but the CTA stays monthly. *Mitigation:* a clear "Anual em breve" hint when the toggle is on; the CTA href stays on the monthly Stripe ID.
- **R3 — Stripe Price IDs leak via NEXT_PUBLIC_*.** Stripe Price IDs are not secrets but they shape what users can purchase. *Mitigation:* the env vars are server-only (no `NEXT_PUBLIC_` prefix); the page passes only the resolved CTA href down to client components.

## Done when

1. `/pricing` renders three tiers + billing FAQ.
2. Pro CTA points to `/login?next=/checkout/pro-monthly` when logged out, `/checkout/pro-monthly` when logged in.
3. Annual toggle swaps the displayed price for Pro; CTA stays on monthly path.
4. `pnpm test` + `pnpm typecheck` green; e2e `@full` green.
5. Plan file (this doc) committed alongside implementation.
