# Task 20 — SEO Foundation

## Summary
Every requirement from §9: per-profile/per-locale meta tags, JSON-LD, sitemap, robots.txt, hreflang, canonical URLs.

## PRD references
- §9 (SEO), §10 (i18n), §2 goal #3 (outrank for branded queries).

## Dependencies
- task-19.

## Scope (in)
- Per-profile `<title>`, `<meta description>`, OG tags, Twitter card sourced from `ProfileContent.{metaTitle, metaDescription, ogImage}`.
- Auto-generated `metaTitle` fallback: `{Artist Name} — Press Kit & EPK`.
- JSON-LD `MusicGroup` (default) or `Person` schema with `sameAs` array from `SocialLinks`.
- `/sitemap.xml` enumerating all `published` profiles, regenerated daily + on publish.
- `/robots.txt` allowing public profiles, blocking `/dashboard/*`, `/admin/*`, `/api/*`.
- Canonical: `https://presskit.pro/{slug}` (no locale prefix).
- `<link rel="alternate" hreflang="…">` per supported locale (and `x-default`).

## Scope (out)
- Schema generation for `/explore` directory (v2).

## Acceptance criteria
- [ ] Google Rich Results Test passes on a seeded profile.
- [ ] `/sitemap.xml` lists all published profiles with `lastmod` reflecting last publish.
- [ ] Lighthouse SEO score ≥ 95 on a seeded profile.
- [ ] Canonical URL never carries a locale segment.
- [ ] Crawling `/dashboard/profile/123` is `Disallow`-ed by `robots.txt`.

## Implementation notes
- Generate sitemap incrementally — don't load all profiles into memory at once if we cross 10k.
- Default `ogImage` is the hero portrait; allow override per locale.

## Definition of Done
Per Appendix C.
