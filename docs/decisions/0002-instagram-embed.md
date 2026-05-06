# 0002 — Instagram embed strategy (v1, manual oEmbed)

> Status: accepted (task-17). Successor: task-34 (v1 → v2 Graph flow).

## Context

Per PRD §6.6, every published profile has an "Instagram" section with a small grid of recent posts (4–6). Two paths exist for surfacing them:

1. **Graph API auto-pull** — the artist authorizes our Facebook app, we receive a long-lived access token, and pull their feed server-side. This is what task-34 ships in v2.
2. **Manual paste** — the artist pastes 4–6 IG post URLs by hand, we cache embeds, the public profile renders them. This is task-17 / v1.

For v1 we ship the manual path. The artist pays the per-post copy/paste cost; we avoid the Facebook OAuth review process, the token-rotation cron, and the rate-limit headaches.

Within the manual path, two embed sources are possible:

- **Instagram oEmbed (Graph endpoint).** `https://graph.facebook.com/v18.0/instagram_oembed?url=...&access_token=...`. Returns a JSON envelope with an `<iframe>`-compatible HTML payload. **Requires** a Facebook app token — Meta deprecated the unauthenticated endpoint in 2020. App tokens are easy to create but force the developer to register a Facebook app.
- **Blockquote + embed.js loader.** Construct `<blockquote class="instagram-media" data-instgrm-permalink="...">` ourselves from the post URL, then load `https://www.instagram.com/embed.js`. The script hydrates blockquotes into iframes client-side. **No token needed.** Rate-limited (~250 embeds / hr / IP last we measured); fine at our scale (4–6 / page-render).

## Decision

**Hybrid, env-gated dispatch.** The server tries the Graph oEmbed when `INSTAGRAM_OEMBED_ACCESS_TOKEN` is set; otherwise falls back to the blockquote shape. Both produce a string we cache as `InstagramPosts.oembedHtml` (24h TTL). The public renderer doesn't care which path produced the HTML — it lazy-mounts the cached string into the page and triggers `embed.js` exactly once when any blockquote is present.

Editor refresh is per-slot; bulk save uses the same shape as social-links / task-13 (PUT the full list, server reconciles).

## Why not just ship the Graph path?

- **Token bootstrapping is per-deployment.** A solo dev cloning the repo for self-hosting would have to register a Facebook app. The blockquote path works zero-config.
- **Cost & rate-limits.** The Graph call is one round-trip per refresh. The blockquote path is zero round-trips at refresh time (we just rebuild the HTML from the URL).
- **Resilience.** When Meta rotates the oEmbed contract (they did in 2020), our fallback path is unaffected.

## Why not just ship the blockquote path?

- **Customization.** The Graph oEmbed payload includes `author_name`, `thumbnail_url`, `width`, `height` — useful for grid layouts and SSR-rendered placeholders. The blockquote-only path waits for `embed.js` to hydrate before the post becomes visible, which means a layout shift and a network call from the public visitor's browser.

## Storage

New collection `InstagramPosts` (one row per featured post, max 6 per profile). Fields:

- `profile` (FK, indexed) — many-to-one.
- `url` (text, required, max 500).
- `oembedHtml` (textarea, server-built or server-fetched).
- `displayOrder` (number) — array index, set by the route on each save.
- `fetchedAt` (date) — when `oembedHtml` was last refreshed; the editor warns when older than 7 days.

`InstagramConnections` is left untouched. It stays the v2 Graph-OAuth landing spot.

## Render

- The PUBLIC route (task-19) reads `bundle.instagramPosts` (array, sorted by `displayOrder`) and feeds each `oembedHtml` into a small `<LazyEmbed>` client component. `LazyEmbed` is the same shape as task-16's `LazyIframe`, plus a side-effect that loads `https://www.instagram.com/embed.js` once when any blockquote is mounted.
- If the blockquote path is in use, `embed.js` calls `window.instgrm.Embeds.process()` after first mount; we trigger it explicitly on every viewport intersection so the hydrated post replaces the placeholder mid-scroll.

## Refresh cadence

- Editor exposes a per-slot refresh button.
- Save bumps `fetchedAt` for affected rows.
- Stale rows (`fetchedAt > 7d`) get a subtle indicator in the editor.
- Public render uses cached HTML unconditionally; no request-time fetches.
- Background sweep ladder: task-30.

## Out of scope

- Facebook OAuth onboarding flow (task-34).
- Reels-specific players.
- Live `username` derivation (we link to the post; Instagram renders the author).

## Reversibility

If we later decide to drop the manual path entirely, we keep `InstagramPosts.oembedHtml` populated by the v2 Graph cron rather than user paste — schema is unchanged. The editor card disappears; the public render stays.
