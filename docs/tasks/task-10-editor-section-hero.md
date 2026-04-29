# Task 10 — Editor Section: Hero

## Summary
Editor block for the hero: portrait upload, optional logo, tagline (localized), primary CTA configuration.

## PRD references
- §6.3 (Hero), §6.4 step 1, §12.2 (hero style variants).

## Dependencies
- task-09, task-08 (Media collection).

## Scope (in)
- Portrait upload to Supabase Storage `avatars` bucket via signed URL; client compresses to ≤ 2MB before upload.
- Logo upload (optional); SVG accepted in addition to raster.
- Tagline field per locale; counts characters (target 60–80 for SEO meta).
- Primary CTA dropdown: "Contato para shows" / "Book now" / custom.
- Hero style switcher (full-bleed-portrait / split-portrait-text / centered-logo) — writes to `Themes.heroStyle` because layout is a theme concern (task-18 picks this up too).
- Required `alt` text on portrait; save blocked if missing.

## Scope (out)
- Locale tabs (task-29 wires multi-locale UX).
- Multiple portraits (single primary in v1).

## Acceptance criteria
- [ ] Upload of a 6MB JPEG gets compressed to ≤ 2MB before transfer.
- [ ] Save is blocked with inline error when alt text is empty.
- [ ] Switching hero styles updates the preview without re-uploading the portrait.
- [ ] CTA renders the configured destination on the public page (WhatsApp deep link, mailto, or external URL).

## Implementation notes
- Use `next/image` `priority` only for the public hero (task-19) — not for the editor preview.
- Compression: browser-side `canvas` resize to max 2400px on the long edge, then JPEG quality 0.82.

## Definition of Done
Per Appendix C.
