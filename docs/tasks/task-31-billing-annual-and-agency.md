# Task 31 — Billing: Annual Pro + Agency Tier

## Summary
Extend the v1 monthly Pro flow with annual Pro (~2 months free) and the Agency tier (up to 10 profiles, profile switcher, consolidated billing).

## PRD references
- §16 (Pricing tiers), §3 (Agent / Manager persona).

## Dependencies
- task-23 (Stripe foundation), task-08 (`Users.plan`).

## Scope (in)
- Stripe Prices: `pro_monthly`, `pro_annual`, `agency_monthly`, `agency_annual`.
- Plan switching from dashboard settings (upgrade/downgrade with proration).
- Agency profile switcher in the dashboard nav: dropdown of all profiles owned by the agency user.
- Per-agency limit enforcement: max 10 profiles; CTA to contact sales above 10.
- Consolidated billing: single Stripe customer with multiple subscriptions/products as needed.
- Pricing page (task-22) updated to show annual toggle and Agency column.

## Scope (out)
- Multi-user team accounts within an Agency (out of scope per §2 non-goals).

## Acceptance criteria
- [ ] Switching from monthly to annual prorates correctly.
- [ ] An Agency user can create up to 10 profiles, blocked at 11.
- [ ] Profile switcher persists last-active profile per session.
- [ ] Stripe webhook plan-change events update `Users.plan` within 5s.

## Implementation notes
- Don't represent profile-count limits client-side only — enforce server-side on `Profiles` create.

## Definition of Done
Per Appendix C.
