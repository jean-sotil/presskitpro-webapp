# Task 08 — Payload Collections (Data Model)

## Summary
Implement every Payload collection from §7 of the PRD, with field-level validations, hooks, and access control.

## PRD references
- §7 (Data model — Users, Profiles, ProfileContent, Media, SocialLinks, FeaturedTracks, Themes, InstagramConnections), §14 (security: encrypted tokens).

## Dependencies
- task-02 (architecture confirmed), task-07 (slug rules) for `Profiles.slug` validator.

## Scope (in)
- Collections exactly as specified in §7, including localized fields on `ProfileContent`.
- Access control: a user can only read/write their own `Profiles` and child docs; admins see everything.
- `Themes` is one-to-one with `Profiles` (uniqueness enforced).
- `InstagramConnections.accessToken` encrypted at rest using Supabase pgcrypto symmetric key.
- `afterChange` hook on `Profiles` that triggers ISR revalidation when `status` flips to `published`.
- Seed script that creates 5–10 demo profiles for the marketing carousel and Lighthouse benchmarking.

## Scope (out)
- Public read paths (those go through Local API in task-19).
- Daily health-check cron (task-30).

## Acceptance criteria
- [ ] All collections type-generate via `payload generate:types` and consume cleanly in Next.
- [ ] Attempting to write another user's profile via REST returns 403.
- [ ] Encrypted tokens are unreadable in raw DB dumps.
- [ ] Demo seed produces a profile that scores ≥ 95 Lighthouse Performance on first run.

## Implementation notes
- Localized fields use Payload's `localized: true`; default locale matches `Profiles.defaultLocale`.
- Don't store derived fields (e.g. `pressKitProvider`) as raw user input — derive in a `beforeChange` hook from the URL.
- Add DB indexes: `profiles.slug` unique, `analytics_events(profile_id, occurred_at)` btree.

## Definition of Done
Per Appendix C.
