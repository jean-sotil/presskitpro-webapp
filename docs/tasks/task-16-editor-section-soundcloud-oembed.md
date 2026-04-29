# Task 16 — Editor Section: Featured SoundCloud Track (oEmbed)

## Summary
Single featured SoundCloud track per profile, rendered via SoundCloud's public oEmbed endpoint.

## PRD references
- §6.6 SoundCloud, §6.4 (renders on public page), §18 row #3.

## Dependencies
- task-09, task-08 (`FeaturedTracks`).

## Scope (in)
- URL field accepting SoundCloud track or playlist URLs.
- Server-side fetch of `https://soundcloud.com/oembed?url={input}&format=json` on save.
- Cache the returned `html` in `FeaturedTracks.oembedHtml` along with `fetchedAt`.
- Re-fetch on demand button ("Refresh embed").
- Display preview in the editor and public page with `loading="lazy"` on the iframe.
- Sanitize the returned HTML — only allow the `iframe` SoundCloud returns.

## Scope (out)
- Custom waveform player (v2 — task-34).
- Multiple featured tracks (v2).

## Acceptance criteria
- [ ] Pasting a valid track URL renders the player within 3s.
- [ ] Invalid URL returns inline error with link to SoundCloud help.
- [ ] iframe has a descriptive `title` attribute (a11y per §11).
- [ ] Cached `oembedHtml` is preferred on render; revalidates only if `fetchedAt` is older than 30 days.

## Implementation notes
- The oEmbed iframe is loaded only after intersection (per §13 perf strategies).
- Sanitize HTML with a strict allowlist (e.g. `dompurify` configured to permit only `iframe` with the SoundCloud src host).

## Definition of Done
Per Appendix C.
