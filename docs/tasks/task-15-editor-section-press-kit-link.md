# Task 15 — Editor Section: Press Kit External Link

## Summary
Single URL field where the DJ pastes their externally hosted press kit, with HTTPS + HEAD validation and provider auto-detection.

## PRD references
- §6.5 (Press kit link — full spec), §7 (`pressKitUrl`, `pressKitProvider`, `pressKitHealthStatus`), §18 row #8.

## Dependencies
- task-09, task-08.

## Scope (in)
- URL input field with live validation badge.
- On save: server-side HEAD request; reject 4xx/5xx responses.
- Provider detection from URL host: `gdrive`, `dropbox`, `wetransfer`, `notion`, `mediafire`, `onedrive`, `other`.
- Display a small "Hosted on Google Drive" badge next to the public CTA when provider is recognized.
- Initial `pressKitHealthStatus = healthy`; flips to `warning`/`broken` via the cron in task-30.
- Inline help: "Tip: make sure the link is publicly viewable, not 'restricted to people in your org'."

## Scope (out)
- Hosting/proxying assets ourselves (explicit non-goal per §6.5).
- ZIP generation from gallery (explicit non-goal).
- Daily health-check job (task-30).

## Acceptance criteria
- [ ] Save with a 404 URL shows inline error and does not persist.
- [ ] HEAD request is server-side only — never CORS-blocked from the browser.
- [ ] Recognized providers render the correct badge on the public page.
- [ ] Public CTA opens in new tab with `rel="noopener noreferrer"`.
- [ ] CTA click fires `press_kit_click` analytics event.

## Implementation notes
- HEAD timeout: 8s. If the host blocks HEAD, fall back to a ranged GET (Range: bytes=0-0).
- Never follow more than 5 redirects; record the final URL as the canonical.
- Some providers (Google Drive) return 200 even for "view denied" — for those, do a heuristic check on `Content-Disposition` / `Content-Type` or accept a follow-up "I tested it" confirmation.

## Definition of Done
Per Appendix C.
