# Task 17 — Implementation Plan (RFC-Lite)

> Architectural artifact for [task-17-editor-section-instagram-oembed.md](./task-17-editor-section-instagram-oembed.md).
> Companion to [decisions/0002-instagram-embed.md](../decisions/0002-instagram-embed.md).
> Authored under the Maestro protocol. Length: < 300 lines.

## Why

Instagram's manual-paste flow is the v1 surface for showcasing recent posts. It introduces three patterns the v2 Graph flow (task-34) and any future "list of cached embeds" surface reuse:

1. **Hybrid embed dispatch** — Graph oEmbed when a Facebook app token is configured; blockquote fallback otherwise. Single cached output (`oembedHtml`) regardless of path. Decision-doc 0002 records the rationale.
2. **`LazyEmbed` with side-effecting hydrator** — same intersection-deferred mount as task-16's `LazyIframe`, plus a singleton script loader for `embed.js` that calls `window.instgrm.Embeds.process()` on mount.
3. **Bulk-replace + per-row refresh** — PUT the full list of posts (reconciler shape from task-13's social-links); each row also has a refresh affordance that re-runs the embed fetch for that single URL.

## Decisions locked

| # | Axis | Decision | Rationale |
|---|---|---|---|
| 1 | Storage | New `InstagramPosts` collection (1 row per featured post, max 6 per profile). Fields: `profile`, `url`, `oembedHtml`, `displayOrder`, `fetchedAt`. `InstagramConnections` is untouched (reserved for task-34's Graph OAuth). | Decision-doc 0002. Decouples manual flow from v2 Graph flow. |
| 2 | Embed dispatch | `fetchInstagramOembed({ url })` checks `INSTAGRAM_OEMBED_ACCESS_TOKEN`; with token → Graph endpoint; without → builds a blockquote locally (zero round-trips). | Decision-doc 0002. Zero-config dev experience. |
| 3 | Sanitization | Same rebuild-from-parts pattern as task-16 — extract iframe `src` (Graph path) or build blockquote from validated post URL (fallback path). Never pass through upstream HTML verbatim. | Defensive XSS posture across all embed surfaces. |
| 4 | Save shape | `PUT /api/profiles/[id]/instagram-posts` body `{ posts: [{ id?, url }] }`. Reconciles existing rows (delete missing, update existing, create new); rewrites `displayOrder` from array index. Uses the same `reconcile` helper shape as social-links. | Same pattern, same expectations. |
| 5 | Per-slot refresh | The same PUT, with `force: true` and the slot's row, re-runs the embed fetch. (Server short-circuits unchanged URLs unless `force` is set.) Documented in the runbook; UI exposes it as a per-row "Atualizar" button. | One route, two affordances. |
| 6 | Bundle extension | `EditorBundle.instagramPosts: Array<{ id, url, oembedHtml, displayOrder, fetchedAt }>`. Live deps: `findInstagramPosts(profileId, user)` sorts by `displayOrder`. | Public render reads from the bundle; editor patches the cache then revalidates. |
| 7 | Editor UI | Vertical sortable list, max 6 slots, drag-reorder. Each slot: URL input + "Atualizar" + "Remover". Stale indicator (subtle text) when `fetchedAt > 7d`. | Spec AC. |
| 8 | Public render | `InstagramFeedRender` reads `bundle.instagramPosts` (sorted by `displayOrder`); empty list → renders nothing (no empty grid, per AC). Each post is a `<LazyEmbed>`. `LazyEmbed` triggers `embed.js` hydration once. | Spec AC. |
| 9 | Out of scope | Facebook OAuth, Graph auto-pull, Reels-specific players, layout customization knobs. | Spec scope-out + task-34. |

## Cross-references

- PRD §6.6 (Instagram), §6.4 step 4 (renders on public profile), §13 (perf — lazy iframes), §18 row #2 (Graph deferred to v2).
- decisions/0002-instagram-embed.md — strategy.
- task-08 (schema patterns), task-09 (autosave + scope dispatch — this task does **not** extend `MutationScope`; uses dedicated route like featured-track), task-13 (bulk-replace reconciler), task-16 (LazyIframe + sanitize-from-parts pattern), task-30 (background sweep), task-34 (v2 Graph flow).

## File inventory

### Schema
- `payload/collections/InstagramPosts.ts` — new collection.
- `payload.config.ts` — register the collection.
- `migrations/<ts>_task_17_instagram_posts.ts` — generated.

### Pure helpers (TDD)
- `lib/server/instagram-validate.ts` (+ test) — `parseInstagramPostUrl(raw)` → `{ ok, canonical, shortcode, kind }` or error. Accepts post / reel / tv / igtv slugs.
- `lib/server/build-instagram-blockquote.ts` (+ test) — given a parsed post URL, produces a sanitized `<blockquote class="instagram-media" data-instgrm-permalink="..." ...>` string with stable, escaped attributes.
- `lib/server/instagram-oembed.ts` (+ test) — `fetchInstagramOembed({ url, fetch?, now?, accessToken? })`. With `accessToken` → Graph call + sanitize. Without → calls `buildInstagramBlockquote`. DI-shaped.
- `lib/server/instagram-posts-reconcile.ts` (+ test) — same shape as `social-links-reconcile`: `{ existing, incoming, deps } → final[]`.

### REST route
- `app/api/profiles/[id]/instagram-posts/route.ts` — `PUT { posts: [{ id?, url }], force?: boolean }`. Auth via `assertOwnsProfile`. Reconciles, fetches embed for new/forced rows, persists.

### Bundle
- `lib/editor/bundle.ts` — extend `EditorBundle` with `instagramPosts`.
- `lib/editor/bundle-live.ts` — wire `findInstagramPosts` → `payload.find('instagram-posts', sort: 'displayOrder')`.

### Editor UI
- `components/editor/sections/InstagramPostsEditCard.tsx` (+ test) — sortable list, capped at 6, per-row refresh + remove, stale indicator.

### Public renderer
- `components/profile/sections/InstagramFeedRender.tsx` — reads `bundle.instagramPosts`, renders each via `<LazyEmbed>`. Returns `null` when the list is empty.
- `components/profile/sections/LazyEmbed.tsx` (+ test) — lazy-mounts the cached HTML; loads `embed.js` on first mount; calls `window.instgrm.Embeds.process()` after mount.

### Wire-up
- `lib/editor/sections.ts` — flip `instagramFeed.hasEditor = true`.
- `components/editor/EditorPane.tsx` — add `case 'instagramFeed'`.

### Env
- `.env.example` — `INSTAGRAM_OEMBED_ACCESS_TOKEN` (optional; documents the Graph path).

### E2E + runbook
- `tests/e2e/editor-instagram.spec.ts` — `@full` happy path (paste 2 URLs, save, public renders both).
- `docs/runbooks/dev-editor.md` — append the recipe + token wiring instructions.

## Implementation sequence

1. **Decision doc** (already written) + **plan doc** (this).
2. **Schema + migration.**
3. **Pure helpers (TDD)** — validate, blockquote builder, oEmbed dispatch, reconciler.
4. **Bundle extension** + bundle-live wiring.
5. **REST route.**
6. **InstagramPostsEditCard (TDD).**
7. **LazyEmbed + InstagramFeedRender polish (TDD).**
8. **Wire registry + EditorPane + .env.example.**
9. **E2E + runbook.**

## Acceptance evidence

| AC | How verified |
|---|---|
| Pasting a valid IG post URL renders within 3s | EditCard test mocks `fetch` for the route; assert preview blockquote/iframe appears. |
| Stale embeds show "Refresh recommended" | EditCard test sets `fetchedAt` to `now - 8d`; assert the indicator is rendered. |
| Public iframes have descriptive titles | LazyEmbed builds the iframe title from the post URL shortcode; tested. |
| Empty list hides section | InstagramFeedRender test: empty `instagramPosts` → returns null. |

## Test plan

- **Unit:** `parseInstagramPostUrl` (post / reel / tv / non-IG hosts), `buildInstagramBlockquote` (escaping + missing fields), `fetchInstagramOembed` (token + tokenless paths, malformed responses), `instagram-posts-reconcile` (CRUD diff). `InstagramPostsEditCard` (cap, drag, refresh, stale). `LazyEmbed` (intersection mount, embed.js loader idempotency).
- **Integration:** `InstagramFeedRender` against fixture bundles.
- **E2E:** `@full` happy path (skip-flag gated).

## Out of scope

- Facebook OAuth & Graph auto-pull — task-34.
- Reels-specific players.
- Background sweep cron — task-30.

## Risks

- **R1 — Meta rotates the blockquote contract.** They have done this twice (2018, 2020). Our `buildInstagramBlockquote` is small and isolated; recovery is one-file.
- **R2 — embed.js rate limit on busy public pages.** Visible as un-hydrated blockquotes. Mitigation: `LazyEmbed` only mounts on viewport intersection (4–6 hits per page max).
- **R3 — Wrong content (post deleted / private).** The blockquote stays; embed.js renders an error placeholder. Editor's per-row refresh button forces a re-fetch; if Graph oEmbed is configured it'll surface a 404 we can flag.
- **R4 — XSS via attacker-supplied URL.** `parseInstagramPostUrl` rejects anything not on `instagram.com`; `buildInstagramBlockquote` HTML-escapes every attribute we emit.

## Done when

1. Migration applied; types regen clean.
2. Pure helpers TDD green; reconciler covered.
3. Editor saves up to 6 slots; reorder persists; refresh re-fetches.
4. Public render emits one card per slot (lazy-mounted); embed.js hydrates blockquotes.
5. `pnpm test` + `pnpm typecheck` green; e2e `@full` green when token set.
6. Plan + decision docs committed alongside implementation.
