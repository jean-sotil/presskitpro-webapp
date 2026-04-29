# Task 17 — Editor Section: Instagram Manual Embed (oEmbed)

## Summary
v1 Instagram flow: DJ pastes 4–6 Instagram post URLs and we render embeds via oEmbed. No Facebook OAuth.

## PRD references
- §6.6 Instagram, §6.4 step 4, §18 row #2 (Graph API deferred to v2).

## Dependencies
- task-09, task-08.

## Scope (in)
- Up to 6 IG post URL slots; reorderable.
- Server-side oEmbed fetch with caching (24h TTL).
- Manual "Refresh" button per slot to re-fetch the oEmbed.
- Lazy-loaded embed iframes on the public page (intersection-triggered).
- Empty-state copy nudging the DJ to refresh embeds monthly (mitigation for risk #11).

## Scope (out)
- Auto-pull from Instagram Graph API (task-34, v2).
- Reels-specific players.

## Acceptance criteria
- [ ] Pasting a valid IG post URL renders within 3s.
- [ ] Stale embeds (older than 7 days) show a subtle "Refresh recommended" indicator in editor.
- [ ] Public page renders embeds with descriptive iframe titles.
- [ ] Removing all 6 hides the Instagram section on the public page entirely (no empty grid).

## Implementation notes
- Instagram oEmbed requires a Facebook app token now; if unavailable, fall back to `<blockquote class="instagram-media">` + the embed.js loader (rate-limited).
- Document the chosen approach in `docs/decisions/0002-instagram-embed.md`.

## Definition of Done
Per Appendix C.
