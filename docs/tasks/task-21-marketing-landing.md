# Task 21 — Marketing Landing (`/`)

## Summary
The conversion-driving root page: hero, "what is a press kit" explainer, 3-step "how it works", live example carousel, pricing teaser, FAQ, footer.

## PRD references
- §6.1 (Marketing site), §4 marketing-visitor stories.

## Dependencies
- task-03 (design tokens), task-19 (live examples link to real profiles).

## Scope (in)
- Hero with strong CTA "Crie seu press kit" / "Create your press kit".
- 3-step "how it works" with illustrative micro-copy.
- Live example carousel with 5–10 seeded demo profiles (task-08 seed script).
- Pricing teaser linking to `/pricing` (task-22).
- FAQ accordion (5–8 items addressing personas in §3).
- Footer: privacy, terms, status, social, language toggle (PT/EN — task-29 wires the actual locale).

## Scope (out)
- Pricing details (task-22 owns the dedicated page).
- Blog/long-form content (explicit non-goal in §2).

## Acceptance criteria
- [ ] Lighthouse mobile: Perf ≥ 95, A11y ≥ 95.
- [ ] Click-through to signup is one tap from any viewport.
- [ ] All copy translatable (string keys ready for task-29).
- [ ] Carousel autoplays only when `prefers-reduced-motion: no-preference`.

## Implementation notes
- Treat this page as a marketing surface separate from the editor — no Supabase client until they click signup.
- Image-heavy: use `next/image` with priority only on the hero.

## Definition of Done
Per Appendix C.
