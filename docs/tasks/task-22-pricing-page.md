# Task 22 — Pricing Page (`/pricing`)

## Summary
Public pricing page rendering the trial / Pro / Agency table from §16, plus FAQs about billing.

## PRD references
- §16 (Pricing), §6.1 (links from marketing).

## Dependencies
- task-03, task-23 (Stripe drives final prices).

## Scope (in)
- Three columns: Trial (14d, no card), Pro monthly, Agency.
- Pro annual toggle (lands fully in task-31, but UI placeholder exists in v1).
- "Includes" lists per tier per §16.
- Primary CTA per tier — for Trial, lands at signup; for Pro, requires login then routes to Stripe Checkout.
- Billing FAQ: refunds, cancellations, what happens if I don't convert (links the §16 grace logic).

## Scope (out)
- Currency localization (no pricing on public profiles — out of scope; pricing page itself ships in USD initially, BRL conversion in v2 if needed).

## Acceptance criteria
- [ ] All copy translatable.
- [ ] Logged-out CTA on Pro routes through `/login?next=/checkout/pro-monthly`.
- [ ] Lighthouse Perf ≥ 95.

## Implementation notes
- Source price values from a single config module; Stripe Price IDs sit alongside display values to prevent drift.

## Definition of Done
Per Appendix C.
