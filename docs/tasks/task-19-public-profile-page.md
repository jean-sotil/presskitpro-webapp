# Task 19 — Public Profile Page (`/{slug}`)

## Summary
The product's hero deliverable: the server-rendered, ISR-cached, Lighthouse-95 public profile page at `presskit.pro/{slug}`.

## PRD references
- §6.4 (Page structure), §8 (RSC + Local API), §9 (SEO), §13 (perf), §11 (a11y).

## Dependencies
- task-08, task-18, task-03, task-20 (SEO foundation lands here).

## Scope (in)
- Server component fetches the profile via Payload Local API by slug.
- Hard 404 for unpublished, missing, or paused (trial-expired) slugs — except trial-expired which renders the "Press kit is paused" page (per §16).
- Section order driven by `Themes.sectionOrder`.
- Theme tokens injected as a `<style>` block in `<head>`.
- Anchor nav (Sobre, Serviços, Press Kit) with smooth scroll, respects reduced-motion.
- IG feed and SoundCloud iframes loaded only on intersection.
- Hero portrait via `next/image priority` with explicit dimensions (CLS guard).
- Single `<h1>` = artist name; semantic landmarks per §11.
- ISR with on-demand revalidation triggered from Payload `afterChange` hook on publish.

## Scope (out)
- Locale toggle UI (task-29).
- /explore directory (v2).

## Acceptance criteria
- [ ] Lighthouse mobile (4G profile) on a seeded profile: Perf ≥ 95, A11y ≥ 95, BP ≥ 95, SEO ≥ 95.
- [ ] LCP < 2.5s, CLS < 0.1, INP < 200ms on a real Pixel 6 device test.
- [ ] axe-core CI returns zero critical or serious violations.
- [ ] Total page weight (excluding hero image) < 600KB compressed (per §13).
- [ ] Republishing in the editor invalidates the public ISR cache within 5s.

## Implementation notes
- Avoid client-side fetching for any above-the-fold content.
- Use `Vary: Accept-Language` on the response (per §18 risk #12 mitigation).
- Pre-warm the cache for top-N most-visited profiles via a daily cron.

## Definition of Done
Per Appendix C.
