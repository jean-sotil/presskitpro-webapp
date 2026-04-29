# Task 26 — Performance Budget Enforcement

## Summary
Drive Lighthouse Performance ≥ 95 mobile and meet LCP/INP/CLS targets via a fixed budget enforced in CI.

## PRD references
- §13 (Performance targets), §19 (success metrics).

## Dependencies
- task-04 (Lighthouse-CI scaffold), task-19.

## Scope (in)
- Lighthouse-CI budget file (LHCI `assert` config) blocking PRs that drop below targets.
- Bundle-size budget per route (`@next/bundle-analyzer` + a script that fails CI on regression > 10KB).
- AVIF + WebP image variants via Supabase Storage transforms; `next/image` with explicit dimensions.
- Font subsetting: only ship glyphs needed for PT + EN (Latin + Latin-Extended).
- IG and SoundCloud embeds deferred to intersection.
- Edge cache tuning for the public profile route (CDN-Cache-Control with stale-while-revalidate).

## Scope (out)
- HTTP/3 push, preload of every font (we let `font-display: swap` handle it).

## Acceptance criteria
- [ ] LCP < 2.5s on a Pixel 6 over a 4G profile in WebPageTest.
- [ ] INP < 200ms p75.
- [ ] CLS < 0.1.
- [ ] Public profile route ships < 600KB (excluding hero) compressed.
- [ ] Lighthouse-CI fails the build if Performance < 95.

## Implementation notes
- Hero portrait should be the LCP element — use `priority` + correct `sizes`.
- Avoid client components above the fold on the public page.

## Definition of Done
Per Appendix C.
