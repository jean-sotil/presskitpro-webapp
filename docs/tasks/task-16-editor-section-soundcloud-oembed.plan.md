# Task 16 — Implementation Plan (RFC-Lite)

> Architectural artifact for [task-16-editor-section-soundcloud-oembed.md](./task-16-editor-section-soundcloud-oembed.md).
> Authored under the Maestro protocol. Length: < 300 lines.

## Why

Featured-track is the first surface where we render **provider-supplied HTML**. Three patterns get exercised that downstream tasks (Instagram in task-17, future Spotify/Bandcamp in v2) reuse:

1. **Rebuild from parts, not pass-through.** We never `dangerouslySetInnerHTML` whatever SoundCloud returned. We extract the iframe `src`, validate the host, and rebuild the element ourselves with our own attribute set (incl. `loading="lazy"`, descriptive `title`, our `allow` policy). Same defensive posture as the URL canonicalizers in tasks 13/14/15.
2. **Cache-on-write, lazy-revalidate.** The oEmbed call happens on the editor's "Salvar" click; the result is cached as a string in `FeaturedTracks.oembedHtml` plus `fetchedAt`. The public render uses the cached HTML — it never calls SoundCloud at request time. Manual refresh via a button when stale; a future cron (task-30 ladder) can sweep > 30-day rows.
3. **Intersection-deferred iframe.** Per PRD §13, the iframe is mounted only when its placeholder enters the viewport. This is a tiny client component (`LazyIframe`) that the public render uses; no library dependency.

## Decisions locked

| # | Axis | Decision | Rationale |
|---|---|---|---|
| 1 | Storage | Existing `FeaturedTracks` schema — one row per profile (1:1). Use `provider: 'soundcloud'`, `url`, `oembedHtml` (the rebuilt-by-us HTML, not SoundCloud's verbatim string), `fetchedAt`. | Schema already in place from task-08. The `oembedHtml` field stores **our** sanitized output, not the raw oEmbed response. |
| 2 | Save shape | Dedicated `PUT /api/profiles/[id]/featured-track` (sets/upserts the URL + fetches oEmbed inline) and `DELETE` (clears). Don't extend `MutationScope` — autosave-debounced clicks would hammer the SoundCloud API. | The save involves a network call + sanitization. An explicit "Salvar" button makes the cost visible; refresh is a separate user action. |
| 3 | Sanitization | Pure regex+URL parser. Extract `src` from the returned `html`, validate `URL.host === 'w.soundcloud.com'` and `protocol === 'https:'`, rebuild with our own attrs (`loading="lazy"`, `title`, `allow="autoplay; encrypted-media"`). No DOM parser dependency. | Same "rebuild from parsed parts" pattern as social-link canonicalization. Closes the XSS surface even if oEmbed ever ships malicious content. |
| 4 | iframe attrs (rebuilt) | `width="100%" height="166" frameborder="0" allow="autoplay; encrypted-media" loading="lazy" title="<title from oEmbed>"`. Keep height conservative (166px = SoundCloud's "compact" mode default) so the section doesn't dominate the page. | Spec a11y AC ("descriptive `title`"), spec perf AC (`loading="lazy"`). |
| 5 | Lazy mount | New `<LazyIframe html={…}>` client component. Renders a placeholder `<div>` with `IntersectionObserver`; swaps in the iframe HTML on first intersection. SSR-safe (initial render is the placeholder). | Spec implementation note. `loading="lazy"` alone defers fetch but the iframe is still in the DOM; this defers the DOM cost too. |
| 6 | Refresh cadence | Editor exposes a "Atualizar embed" button that re-fetches oEmbed on demand. The render does NOT auto-revalidate — it always reads the cached `oembedHtml`. Spec's "revalidate after 30 days" gets a server-side staleness check on the next save (we re-fetch automatically if `fetchedAt` is older than 30d when the user clicks Salvar). Background revalidation lands in task-30. | One source of truth (cache), one revalidator (the user), one sweep (cron, future). No race between request-time and write-time. |
| 7 | Validation | URL must be `soundcloud.com` or `*.soundcloud.com`. The oEmbed endpoint accepts track + playlist URLs. We don't pre-validate the URL shape beyond host check; SoundCloud's 404 handles unknown tracks. | Trust the upstream. |
| 8 | Out of scope | Custom waveform; multiple tracks; cron revalidation. | Spec scope-out + task-30. |

## Cross-references

- PRD §6.6 (SoundCloud), §6.4 (renders on public), §11 (a11y), §13 (perf — lazy iframes), §18 row #3.
- task-08 (schema), task-09 (autosave shell), task-13/14/15 (rebuild-from-parts pattern), task-30 (future cron sweep), task-17 (Instagram oEmbed — same shape).

## File inventory

### Pure helpers (TDD)
- `lib/server/sanitize-soundcloud-iframe.ts` (+ test) — `extractSafeIframe(rawHtml, title)` returns `{ ok, html }` or null. Strict: only accepts iframes whose `src` host is `w.soundcloud.com`.
- `lib/server/soundcloud-oembed.ts` (+ test) — `fetchSoundcloudOembed({ url, fetch?, now? })` calls `https://soundcloud.com/oembed?url=...&format=json`, validates the JSON shape, runs the sanitizer, returns `{ ok, oembedHtml, fetchedAt }` or an error reason. DI-shaped.

### REST route
- `app/api/profiles/[id]/featured-track/route.ts` — `PUT { url }` upserts the row (own-the-profile auth via `assertOwnsProfile`), runs the oEmbed fetch, persists. `DELETE` clears it.

### Editor
- `components/editor/sections/FeaturedTrackEditCard.tsx` (+ test) — URL input, "Salvar" button, preview iframe, "Atualizar" button, "Remover" button.

### Public renderer
- `components/profile/sections/FeaturedTrackRender.tsx` — uses cached `oembedHtml` if present; falls back to a plain link if not.
- `components/profile/sections/LazyIframe.tsx` (+ test) — mounts the iframe on first viewport intersection.

### Wire-up
- `lib/editor/sections.ts` — flip `featuredTrack.hasEditor = true`.
- `components/editor/EditorPane.tsx` — add `case 'featuredTrack'`.

### E2E + runbook
- `tests/e2e/editor-featured-track.spec.ts` — `@full` happy path (paste URL → save → preview shows player → reload preserves).
- `docs/runbooks/dev-editor.md` — append the featured-track recipe + test track URLs.

## Implementation sequence

1. **Pure helpers (TDD)** — sanitize-soundcloud-iframe, soundcloud-oembed.
2. **REST route** — PUT + DELETE.
3. **FeaturedTrackEditCard (TDD).**
4. **LazyIframe + FeaturedTrackRender polish (TDD).**
5. **Wire registry + EditorPane.**
6. **E2E + runbook.**

## Acceptance evidence

| AC | How verified |
|---|---|
| Pasting a valid track URL renders the player within 3s | EditCard test mocks `fetch` to return a successful oEmbed payload; assert preview iframe appears. (E2E covers the live network round-trip.) |
| Invalid URL returns inline error with link to SoundCloud help | EditCard test on `{ ok: false, reason: 'not-found' }` asserts the help link appears. |
| iframe has a descriptive `title` attribute | Sanitizer test asserts the rebuilt HTML contains `title="..."` derived from oEmbed's `title` field. |
| Cached `oembedHtml` is preferred on render; revalidates only if fetchedAt > 30d | Public render reads `bundle.featuredTrack.oembedHtml` directly; the route's PUT handler tests assert it skips re-fetch when `fetchedAt` is recent and re-fetches when stale. |

## Test plan

- **Unit:** `extractSafeIframe` (host accept/reject, missing src, http rejected, title pass-through), `fetchSoundcloudOembed` (200 happy, 404, malformed JSON, network timeout), `FeaturedTrackEditCard` (save/refresh/remove flows, error states), `LazyIframe` (renders placeholder before intersection, mounts iframe after).
- **Integration:** `FeaturedTrackRender` against fixture bundles with + without `oembedHtml`.
- **E2E:** `@full` happy path (skip-flag gated).

## Out of scope

- Custom waveform / Spotify / Bandcamp / multiple tracks — task-34.
- Background cron revalidation — task-30.

## Risks

- **R1 — SoundCloud changes their iframe markup.** Sanitizer extracts only the `src`; minor markup changes don't break us. Major changes (e.g. multiple iframes, JS-rendered content) would, but those are non-trivial and detectable in QA.
- **R2 — oEmbed rate-limits.** SoundCloud's docs are quiet on limits. Our cache + manual-refresh model means each profile hits the endpoint at most once per save / explicit refresh. A future cron sweep (task-30) needs to throttle if it fans out.
- **R3 — Sanitizer false negative** (rejects a valid SoundCloud iframe). User sees "Não conseguimos validar a resposta do SoundCloud." The error includes the upstream `html` snippet (truncated) for debugging.
- **R4 — IntersectionObserver unavailable.** Falls back to immediate mount in the `LazyIframe` effect. No degradation beyond losing the perf optimization.

## Done when

1. Pure helpers TDD green; sanitizer rejects every fuzzed bad input.
2. PUT + DELETE route handlers TDD green via DI.
3. EditCard saves and persists the oEmbed; preview shows the player.
4. Public render shows the cached embed; LazyIframe defers DOM mount until viewport.
5. `pnpm test` + `pnpm typecheck` green; e2e `@full` green.
6. Plan file (this doc) committed alongside implementation.
