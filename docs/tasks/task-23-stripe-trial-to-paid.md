# Task 23 — Stripe Integration: Trial → Paid Conversion

## Summary
14-day no-card trial; card collected at the moment of conversion via Stripe Checkout. Day-12 nudge, Day-14 expiration with profile flip to `unpublished`, slug held for 90 days.

## PRD references
- §16 (Pricing & monetization), §18 risk #9.

## Dependencies
- task-05, task-08, task-22.

## Scope (in)
- Trial timer starts at first profile creation; stored on `Users.trialEndsAt`.
- Stripe Customer created lazily on first checkout attempt (no upfront customer = no card requirement).
- Stripe Checkout sessions: monthly Pro, annual Pro (task-31), Agency (task-31).
- Webhook handler for `checkout.session.completed`, `customer.subscription.deleted`, `invoice.payment_failed`.
- Day-12 reminder: in-app banner + transactional email.
- Day-14 cron: profiles whose `trialEndsAt < now()` and have no active subscription flip to `unpublished`.
- Public profile route returns the "Press kit is paused" template (200 OK, not 404) for paused slugs.
- Day-90 cron: paused profiles still without an active sub release the slug back to the pool (queued for task-32 reclamation).

## Scope (out)
- Annual + Agency tiers (those land in task-31; in v1 only the monthly Pro Stripe price ships, but webhook code anticipates the others).

## Acceptance criteria
- [ ] A user converted on Day 7 keeps their existing slug and profile state seamlessly.
- [ ] A user who lets the trial lapse sees a clean "paused" page on their public URL (no 404).
- [ ] Failed payment flips the profile to paused after 3 retries (per Stripe default smart retries) + email notification.
- [ ] Webhook signature verification is enforced; replays are idempotent.

## Implementation notes
- Stripe webhook secret per environment.
- Use a server-side cron (e.g., Supabase Scheduled Function or a Vercel Cron) at hourly cadence; daily resolution is sufficient for trial expiration.
- Don't rely on Stripe for the trial timer — keep our own `trialEndsAt` so we control "no card required" UX.

## Definition of Done
Per Appendix C.
