# Task 29 — i18n: PT/EN with `next-intl` (Cookie-Based, No Path Prefix)

## Summary
Ship full internationalization per §10 and the locale fallback matrix in Appendix B.

## PRD references
- §10 (i18n), §18 row #7 (cookie-based decision), Appendix B (locale fallback matrix).

## Dependencies
- task-01 (skeleton), task-19 (public profile), task-09 (editor).

## Scope (in)
- `next-intl` integrated for app chrome (UI labels, dashboard, marketing).
- Profile content localized via `ProfileContent` rows (one per locale).
- Cookie-based locale resolution: server reads `Accept-Language` first, then cookie override.
- Manual locale toggle on public profile (and marketing site); persists to cookie.
- `<link rel="alternate" hreflang="…">` per supported locale (and `x-default`).
- `Vary: Accept-Language` header on public profile responses.
- Locale fallback per Appendix B: missing translation falls back to profile's `defaultLocale` with a banner ("Original in {language}") and correct `lang` attribute on the region.
- ICU MessageFormat for plurals/dates/numbers; `Intl.DateTimeFormat`/`Intl.NumberFormat` for runtime values.

## Scope (out)
- Spanish, French (roadmap only — v2 / task-34).
- Right-to-left layouts.

## Acceptance criteria
- [ ] A profile with only EN content rendered to a `pt-BR` visitor shows EN with the fallback banner.
- [ ] Cookie persists locale across sessions.
- [ ] Translation strings live in `messages/{en,pt}.json` and pass a CI check that all keys exist in every locale file.
- [ ] hreflang tags present and correct on every public profile.

## Implementation notes
- Route: a single canonical URL per profile (no `/{locale}/{slug}`).
- Don't bake locale into the build artifact for the public page — keep it dynamic via headers/cookies and ISR per-locale variants.

## Definition of Done
Per Appendix C.
