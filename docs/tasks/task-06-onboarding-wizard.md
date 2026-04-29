# Task 06 — Onboarding Wizard (5 Steps to First Profile)

## Summary
First-login wizard that walks a new user from "I just signed up" to "I have a draft profile in the editor" in under 3 minutes.

## PRD references
- §6.2 (Onboarding wizard steps), §2 goal #1 (TTPP < 10 min).

## Dependencies
- task-05 (auth), task-07 (slug rules), task-08 (Profiles collection).

## Scope (in)
- 5-step wizard: slug → portrait + logo upload (skippable) → tagline → services multi-select → at least one social link.
- Real-time slug availability check (debounced 300ms) hitting `/api/slug/check`.
- Wizard progress persisted server-side; user can refresh and resume.
- On completion: profile created in `draft` status, redirect to `/dashboard/profile/{id}`.
- Inline help copy aligned with §3 personas (especially "Emerging DJ" who needs prompts).

## Scope (out)
- Theme picker (lives in editor's Theme tab — task-18).
- Custom domain (v2).

## Acceptance criteria
- [ ] Median wizard completion under 3 minutes in an internal usability test (n ≥ 5).
- [ ] Slug check returns within 200ms p95.
- [ ] Skipping the upload step does not block progression.
- [ ] Closing the browser mid-wizard preserves all entered state.
- [ ] Keyboard-only completion is possible end-to-end.

## Implementation notes
- The wizard is a client component but persists each step via server actions to keep state consistent.
- Use TanStack Query mutations with optimistic updates for snappy feel.
- Fire a `onboarding_step_completed` analytics event per step (task-24 consumes it).

## Definition of Done
Per Appendix C.
