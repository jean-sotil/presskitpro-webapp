# Task 13 — Editor Section: Social Links

## Summary
Manage the artist's outbound social links: Instagram, SoundCloud, Spotify, Beatport, YouTube, TikTok, email, WhatsApp.

## PRD references
- §6.3 (Social links), §6.4 (icons in hero block).

## Dependencies
- task-09, task-08 (`SocialLinks` collection).

## Scope (in)
- Add/remove/reorder rows; each row has `platform` (enum) + `url` field.
- Per-platform URL validation (e.g., Instagram URL must be `instagram.com/{handle}`; WhatsApp requires E.164).
- Inline icon preview from the design-token icon set.
- Email and WhatsApp render as `mailto:` and `https://wa.me/...` deep links on the public page.
- Maximum 10 links to keep the hero scannable.

## Scope (out)
- OAuth-connected handles (Instagram Graph API in v2 — task-34).

## Acceptance criteria
- [ ] Pasting `@handle` (without protocol) is auto-normalized to a canonical URL.
- [ ] Invalid URLs surface inline with a link to "How to find your Spotify URL".
- [ ] Reorder persists; renders in the same order on the public page.
- [ ] WhatsApp validation enforces a valid country code + number.

## Implementation notes
- Don't trust user-entered URLs — sanitize and rebuild from parsed parts where possible to prevent open-redirect/XSS.

## Definition of Done
Per Appendix C.
