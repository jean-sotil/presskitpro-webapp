# Task 33 — LGPD Compliance: Data Export & Account Deletion

## Summary
Self-serve account-data export and full deletion to comply with LGPD (Brazilian market is primary per §14).

## PRD references
- §14 (Privacy / LGPD), §17 V1 scope.

## Dependencies
- task-08, task-27.

## Scope (in)
- `/dashboard/settings/privacy` page with two CTAs: Export My Data, Delete My Account.
- Export: server job collects all user-owned rows + storage objects → ZIP → emails a signed download link valid for 24h.
- Delete: confirmation modal (type your email to confirm) → soft-deletes immediately (profile flips to unpublished, public 404), hard-deletes after 14-day grace.
- Deletion fans out to: Payload collections, Supabase Auth, Supabase Storage, Stripe Customer (cancel + redact metadata where allowed), PostHog (`delete person`), Sentry (`Right to be forgotten`).
- Audit log of every deletion request.

## Scope (out)
- DPO automation portal (manual handling for now).

## Acceptance criteria
- [ ] Export ZIP contains every profile, ProfileContent locale, gallery image (or signed URLs to the originals), social links, themes, and analytics rollups.
- [ ] Hard-delete after grace removes the user from auth + Stripe + PostHog within 24h.
- [ ] Privacy policy updated to reflect the export + delete process.
- [ ] Soft-deleted profile's public URL returns 404, not paused-page.

## Implementation notes
- Build the export as a background job (don't block the request); email the link when ready.
- Stripe data may require retention for legal/tax — document what we retain and why.

## Definition of Done
Per Appendix C.
