# PressKit.pro — Product Requirements Document

**Status:** Draft v0.2 — open questions resolved
**Owner:** TBD
**Last updated:** 2026-04-29

---

## 1. TL;DR

PressKit.pro is a hosted platform that lets electronic-music DJs spin up a polished, single-page press kit website at `presskit.pro/{slug}` in minutes. Each profile aggregates the artist's bio, services, social links, photo gallery, downloadable EPK assets, and live embeds (SoundCloud featured track, latest Instagram posts) — all behind a fully self-service editor.

The visual reference is a dramatic, dark, portrait-led design (see attached) that doubles as both an artist's online business card and a bookable EPK that promoters/venues can forward.

**Tech stack:** Next.js (App Router), Tailwind CSS, Supabase (Postgres + Auth + Storage), Payload CMS (content modeling + admin), TanStack Query.

**Pillars:** SEO-first (every profile must rank for the artist's name), i18n by default (PT/EN at launch), WCAG 2.2 AA accessibility.

---

## 2. Vision & Goals

### Vision
Become the default press-kit destination for working DJs — the link they paste into every booking inquiry, every Instagram bio, every cold pitch.

### Primary goals (first 6 months)
1. **Time-to-published-profile under 10 minutes** for a new user with no design help.
2. **Public profiles score ≥ 95 on Lighthouse** for Performance, Accessibility, Best Practices, SEO on mobile.
3. **Profile pages outrank** the artist's other web presences for branded queries (`{artist name} press kit`, `{artist name} dj`).
4. **Self-serve onboarding ≥ 80%** — users complete a profile without contacting support.

### Non-goals (for v1)
- Booking/payments marketplace (no transactions between bookers and DJs).
- Native mobile apps.
- Multi-user team accounts (one user → one or more profiles, but no shared editorial seats).
- Audio hosting (we embed; we don't store/stream).
- Long-form blogging.

---

## 3. Target Users & Personas

| Persona | Description | Primary need |
|---|---|---|
| **The Working DJ** (primary) | Mid-career artist playing weddings, clubs, festivals. Tech-comfortable but not technical. Already has IG + SoundCloud. | A link to send promoters that looks expensive and is easy to keep current. |
| **The Emerging DJ** | Just starting out; few assets; needs structure. | Templates, prompts, "what does a press kit even contain?" guidance. |
| **The Promoter / Venue Booker** (consumer) | Lands on a profile from a DM or email. Skim-reads, wants press kit ZIP. | Fast load, clear CTA, downloadable assets, contact channel. |
| **The Agent / Manager** | Manages multiple artists. | One login, multiple profiles, easy switching. |

---

## 4. User Stories

### As a DJ (authenticated)
- I can sign up with email or Google and reserve a unique URL slug.
- I can pick from 2–3 starter templates and edit content live.
- I can write my bio in multiple languages (at least PT + EN) and the visitor sees the right one based on browser locale or a manual toggle.
- I can connect my Instagram account so my latest posts auto-populate.
- I can paste a SoundCloud track URL and have it render as a featured player.
- I can upload a photo gallery (drag-and-drop, reorderable).
- I can upload a downloadable press kit ZIP (or have one auto-generated from my assets).
- I can add social links (IG, SoundCloud, Spotify, Beatport, YouTube, TikTok, email, WhatsApp).
- I can list "services" (e.g., Wedding, Club, Corporate) with short descriptions.
- I can preview my profile exactly as the public will see it before publishing.
- I can publish/unpublish at any time.
- I can see basic analytics: page views, press kit downloads, contact-button clicks.

### As a visitor (unauthenticated)
- I can land directly on `presskit.pro/{slug}` and see the artist's profile in my preferred language.
- I can tap "Contato para shows" and reach the artist instantly via WhatsApp / email.
- I can download the press kit ZIP without registering.
- I can see the page render fully in under 2.5s LCP on a 4G mobile connection.
- I can navigate the page with keyboard alone and using a screen reader.

### As a marketing visitor (the root domain)
- I land on `presskit.pro` and immediately understand what the product does.
- I can see live example profiles to evaluate quality.
- I can sign up in two clicks.

---

## 5. Information Architecture

### URL structure

```
presskit.pro/                       → marketing landing
presskit.pro/login
presskit.pro/signup
presskit.pro/pricing
presskit.pro/explore                → directory of public profiles (v2)
presskit.pro/dashboard              → authenticated home
presskit.pro/dashboard/profile/{id} → profile editor
presskit.pro/dashboard/analytics
presskit.pro/dashboard/settings
presskit.pro/admin                  → Payload admin (gated)
presskit.pro/api/*                  → server routes
presskit.pro/{slug}                 → PUBLIC profile page
presskit.pro/{slug}/press-kit.zip   → direct download link
```

### Reserved slugs
The following must be blocklisted at signup: `admin`, `api`, `app`, `dashboard`, `login`, `signup`, `signin`, `signout`, `logout`, `settings`, `account`, `billing`, `pricing`, `explore`, `search`, `blog`, `help`, `support`, `legal`, `terms`, `privacy`, `about`, `contact`, `press`, `presskit`, `assets`, `static`, `_next`, `well-known`, plus a profanity list.

### Locale routing
- Default: cookie-based locale resolution, no locale prefix in URL (`/jeanpastordj` works in PT or EN).
- Manual toggle persists in cookie.
- `<link rel="alternate" hreflang="...">` tags for each supported locale.
- Decision needed: do we ever want `/{locale}/{slug}` URLs for SEO? Recommendation: no — single canonical URL per profile, language served via `Accept-Language` + cookie + on-page toggle.

---

## 6. Feature Specifications

### 6.1 Marketing site (`/`, `/pricing`, `/explore`)
- Hero + "what is a press kit" explainer + 3-step "how it works" + live example carousel + pricing + FAQ + footer.
- Live examples link to real public profiles (we'll seed 5–10 demo profiles).
- CTA "Crie seu press kit" / "Create your press kit" routes to signup.

### 6.2 Authentication & onboarding
- **Auth provider:** Supabase Auth.
- **Methods:** Email + magic link, Google OAuth. (Apple/Facebook deferred.)
- **Onboarding wizard** (after first login):
  1. Choose your slug (with availability check).
  2. Upload hero portrait + logo (or skip).
  3. Write a one-line tagline.
  4. Pick services (multi-select with custom option).
  5. Add at least one social link.
  6. → Land in editor with profile in "draft" state.
- Profile is `unpublished` until the user explicitly publishes; unpublished slugs return 404 publicly.

### 6.3 Profile editor (dashboard)
- Two-pane: form fields on the left, live preview on the right (collapses on mobile to tabs).
- Sections, all individually editable and reorderable:
  - **Hero** (portrait, logo, tagline, primary CTA)
  - **About / Bio** (rich text per locale; tabs for each)
  - **Services** (cards with title + description)
  - **Featured track** (SoundCloud URL → renders embed)
  - **Instagram feed** (connected account → last N posts; manual fallback)
  - **Photo gallery** (drag-drop upload, reorder, alt text required)
  - **Press kit link** (single URL field — Google Drive / Dropbox / etc. — with live validation badge)
  - **Social links** (icon + URL list)
  - **Contact** (WhatsApp number, email, contact form toggle)
- Separate **"Theme" tab** (not part of the section reorder list) where the DJ picks color preset / custom hex, typography pair, hero style, and gallery layout. Live preview updates instantly. Save is blocked if contrast validation fails (see §12.3).
- Auto-save every 5s of inactivity; manual "Publish" button promotes draft → live.

### 6.4 Public profile page
- Mirrors the reference image structure:
  1. Hero (portrait, logo, social/contact icons, primary CTA)
  2. Anchor nav (Sobre, Serviços, Press Kit)
  3. Services section
  4. Instagram feed (4–6 most recent)
  5. Featured SoundCloud player
  6. Bio (with locale tabs if multiple languages provided)
  7. Photo gallery (responsive mosaic)
  8. Press kit download CTA
  9. Footer
- Server-rendered (RSC) for SEO; client islands for the IG feed, SoundCloud player, and locale toggle.
- ISR with on-demand revalidation when the user republishes.

### 6.5 Press kit link
- **Decision:** we do **not** host or generate the press kit bundle. The DJ provides an external URL (Google Drive folder, Dropbox link, WeTransfer, MediaFire, Notion public page, etc.) where their press kit assets live.
- The public profile renders a `Baixar Press Kit` CTA that opens that URL in a new tab with `rel="noopener noreferrer"`.
- **Validation at save:**
  - URL must be a valid HTTPS URL.
  - We perform a HEAD request server-side to confirm 200/3xx response (no broken-link saves).
  - Provider auto-detection: we recognize common patterns (`drive.google.com`, `dropbox.com`, `we.tl`, `notion.so`, `mediafire.com`, `1drv.ms`) and surface a small "Hosted on Google Drive" / etc. badge next to the CTA. Unknown providers still work, just no badge.
- **Health monitoring:** a daily background job HEAD-checks every press kit URL. Two consecutive failures → email the DJ, surface a yellow warning banner in the dashboard. Three consecutive failures → the public CTA is hidden until fixed.
- **Analytics:** we track CTA clicks (since we can't see the actual download server-side). Reported in the dashboard as "Press Kit Clicks."
- **Tradeoffs (acknowledged):**
  - No native UX inside our domain — feels like a redirect.
  - Can't measure actual download completion — only intent (clicks).
  - DJ controls their own files (good: they update without us; bad: link rot risk).
- **What we do NOT do:** generate ZIPs from uploaded assets, store press-kit files in our storage, proxy or rehost user content. Photo gallery uploads (§6.3) are separate and still hosted by us for inline display only.

### 6.6 Integrations

#### Instagram
- **Reality check:** Instagram Basic Display API was deprecated in Dec 2024. New apps use the **Instagram Graph API** with a Business or Creator account linked to a Facebook Page.
- **Implementation:** OAuth via Facebook Login → store long-lived token → server-side fetch of recent media → cache 6h → render as a grid with deep links to instagram.com.
- **Fallback:** Manual curation — user pastes IG post URLs and we use the **oEmbed** endpoint to render embeds (no auth required, but rate-limited).
- **Recommendation for MVP:** ship the manual oEmbed flow first; add OAuth-connected Graph API in v1.1.

#### SoundCloud
- **Reality check:** SoundCloud closed new API key registrations years ago. Public oEmbed and the iframe widget remain available.
- **Implementation:** User pastes a SoundCloud track or playlist URL → we hit `https://soundcloud.com/oembed` → render the returned iframe HTML.
- One featured track per profile in v1; multiple in v2.

#### Other social
- Pure URL fields, rendered as `<a>` with appropriate icons. No API integration.

### 6.7 Analytics for the DJ
- Page views (server-side counter via middleware → Supabase).
- Unique visitors (cookie-less, daily resolution).
- Press kit downloads.
- Contact CTA clicks.
- Top referrers.
- 14-day rolling chart on dashboard.

---

## 7. Data Model (proposed)

> **Architectural decision (open):** Payload CMS owns content; Supabase owns auth, storage, and event/analytics tables. Payload is configured with the **Postgres adapter** pointed at the Supabase database (separate schema, e.g., `payload`). The Next.js app reads via Payload's Local API on the server, falls back to REST/GraphQL if needed.

### Payload collections

**Users**
- Synced from Supabase Auth via webhook on user creation.
- Fields: `id` (= Supabase user UUID), `email`, `displayName`, `role` (`user`|`admin`), `plan` (`free`|`pro`).

**Profiles**
- `id`
- `userId` (relation → Users)
- `slug` (unique, indexed)
- `status` (`draft`|`published`|`unpublished`)
- `pressKitUrl` (string, nullable — external link, see §6.5)
- `pressKitProvider` (enum, auto-detected — `gdrive`|`dropbox`|`wetransfer`|`notion`|`mediafire`|`onedrive`|`other`)
- `pressKitLastCheckedAt` (timestamp — set by daily health-check job)
- `pressKitHealthStatus` (`healthy`|`warning`|`broken`)
- `localesAvailable` (array of locale codes)
- `defaultLocale`
- Timestamps

**ProfileContent** (localized)
- `profileId` (relation → Profiles)
- `locale`
- `tagline`
- `bio` (richText)
- `services` (array of `{title, description}`)
- `metaTitle`, `metaDescription`, `ogImage`

**Media**
- Hero portrait, logo, gallery photos, press kit attachments. Stored in Supabase Storage; Payload holds metadata + signed-URL helpers.
- Required `alt` text on user-facing images.

**SocialLinks**
- `profileId`, `platform` (enum), `url`, `displayOrder`.

**FeaturedTracks**
- `profileId`, `provider` (`soundcloud`), `url`, `oembedHtml` (cached), `fetchedAt`.

**Themes** (one-to-one with Profiles)
- `profileId` (relation → Profiles, unique)
- `colorPresetId` (nullable; if set, user picked a curated preset)
- `bg`, `accent`, `text` (hex values, present when overriding presets)
- `fontPairId` (enum referencing the 8 curated pairs in §12.2)
- `heroStyle` (`full-bleed-portrait` | `split-portrait-text` | `centered-logo`)
- `galleryLayout` (`mosaic` | `uniform-grid` | `carousel`)
- `sectionOrder` (array of section keys)
- `contrastValidatedAt` (timestamp; blocks publish if null or stale)

**InstagramConnections**
- `profileId`, `igUserId`, `accessToken` (encrypted), `tokenExpiresAt`, `lastSyncedAt`.

### Supabase tables (outside Payload)

- `auth.users` (managed by Supabase Auth).
- `analytics_events` (`profile_id`, `event_type`, `occurred_at`, `country`, `referrer`).
- `slug_reservations` (for the reserved slug blocklist + "soft holds" during signup).

### Storage buckets

- `avatars` (public read, owner write) — hero portraits and DJ logos.
- `gallery` (public read, owner write) — inline gallery photos rendered on the public profile.

> Note: there is **no** `presskits` bucket — press kit files are hosted externally by the DJ (see §6.5). We only ever store assets that need inline rendering on our public profile pages.

---

## 8. Tech Architecture

```
                ┌──────────────────────────────────────┐
                │          Next.js App Router          │
                │  (RSC for public, client for editor) │
                └───────────────┬──────────────────────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                 │
        Payload Local API   Supabase JS      TanStack Query
        (server only)       (browser+server) (client cache)
              │                 │
              ▼                 ▼
       ┌──────────────────────────────┐
       │   Supabase Postgres          │
       │   - public schema (Supabase) │
       │   - payload schema (Payload) │
       └──────────────────────────────┘
              │                 │
       Supabase Auth     Supabase Storage
                              │
                  ┌───────────┴────────────┐
                  │                        │
              Instagram               SoundCloud
              Graph API               oEmbed
```

**Key conventions:**
- Public profile pages: **React Server Components**, fetched via Payload Local API. No Supabase client on the public route except for the analytics event POST.
- Editor: client components + TanStack Query against Payload's REST API. Optimistic updates for fast UX.
- Auth gating: Next.js middleware reads Supabase session cookie, redirects unauthenticated `/dashboard/*` requests to `/login`.
- File uploads: client → signed Supabase Storage URL → Payload Media record.
- Image delivery: Supabase Storage transformation API (or Cloudflare Images if we need more) behind `next/image`.

---

## 9. SEO Requirements

- Server-rendered HTML for every public profile (no client-only critical content).
- Per-profile, per-locale `<title>`, `<meta description>`, OG tags, Twitter card.
- JSON-LD `MusicGroup` or `Person` schema with `sameAs` linking out to social accounts.
- Auto-generated sitemap at `/sitemap.xml` enumerating all published profiles.
- `robots.txt` allowing crawl of public profiles, blocking `/dashboard/*` and `/admin/*`.
- Canonical URL per profile (`https://presskit.pro/{slug}`), no duplicates from locale variants.
- `hreflang` tags for each provided locale.
- ISR with 60s stale-while-revalidate; on-demand revalidation triggered by Payload `afterChange` hook on Profile publish.
- All images served via `next/image` with explicit dimensions.
- Lighthouse SEO score target: ≥ 95.

---

## 10. i18n Requirements

- **Library:** `next-intl` (App Router native, supports server components).
- **Launch locales:** Portuguese (pt-BR), English (en).
- **Roadmap locales:** Spanish (es), French (fr).
- **Two scopes of translation:**
  1. **App chrome** (UI labels, dashboard, marketing): translation files in repo, managed by us.
  2. **Profile content** (bio, services, tagline, meta): user-supplied per locale via the editor's locale tabs.
- A profile is valid if it has content in *at least one* locale; missing translations fall back to the profile's `defaultLocale` with a `lang` attribute correctly set on the rendered region.
- Dates and numbers via `Intl.DateTimeFormat` / `Intl.NumberFormat`.
- Currency-free at launch (no pricing displayed on public profiles).

---

## 11. Accessibility (a11y) Requirements

Target: **WCAG 2.2 AA** across all public-facing pages and the editor.

Concrete commitments:
- All interactive controls reachable and operable via keyboard; visible focus rings.
- Color contrast verified against the dark theme (the reference image's white-on-near-black easily passes; we lock down a contrast-checked palette in the design system).
- Semantic HTML: one `<h1>` per page (the artist name), proper heading order, `<nav>`, `<main>`, `<section>` landmarks.
- Images require alt text — the gallery uploader **blocks save** until alt text is filled (or explicitly marked decorative).
- Embeds (Instagram, SoundCloud) wrapped with descriptive `<title>` on iframes and visible labels nearby.
- Forms: associated `<label>`s, `aria-describedby` for hints, `aria-invalid` + `role="alert"` for errors.
- Reduced motion respected (`prefers-reduced-motion`) — disable autoplay-on-scroll behaviors.
- Lang attribute correctly set per locale region.
- Skip-to-content link on every page.
- Automated checks: `axe-core` in CI on key routes; manual screen-reader pass (NVDA + VoiceOver) before each release.

---

## 12. Visual Design Direction & Theming System

The reference image establishes the aesthetic: **dramatic, dark, portrait-led, editorial typography**. We carry that into the **default theme** every profile starts with, then expose a constrained set of theme tokens each DJ can override for their own profile.

### 12.1 Default theme — "Editorial Nightlife"

| Token | Default value | Notes |
|---|---|---|
| `--bg` | `#0a0a0a` | Near-black with warmth |
| `--surface` | `#141414` | Cards, embed wrappers |
| `--border` | `#1f1f1f` | Hairlines |
| `--text` | `#f0ede6` | Warm off-white (not pure `#fff`) |
| `--text-muted` | `#7a7670` | Secondary copy |
| `--accent` | `#00ff88` | Single laser accent for CTAs, hover, focus |
| `--accent-contrast` | `#0a0a0a` | Text-on-accent |
| `--font-display` | `Anton, sans-serif` | Condensed bold poster type |
| `--font-body` | `Manrope, sans-serif` | Clean, characterful |
| `--font-editorial` | `Fraunces, serif` | One italic moment (tagline) |
| `--radius` | `0` | Sharp, editorial |
| `--grain-opacity` | `0.04` | Film grain overlay strength |

Atmosphere: subtle film-grain overlay, generous negative space, asymmetric photo mosaic, numbered section markers (`01 — SOBRE`, `02 — SERVIÇOS`), one orchestrated page-load reveal (staggered fade-ups), no bouncy springs.

### 12.2 Per-profile theme tokens (user-customizable)

Each profile has its own theme record. The DJ can override any of the following from the editor's "Theme" tab:

**Color (presets + custom hex)**
- `bg` — pick from 6 curated dark/light backgrounds, or custom hex.
- `accent` — pick from 12 curated accents (electric green, hot pink, signal red, amber, ice blue, etc.) or custom hex. *Validation: must pass WCAG AA contrast against the chosen `bg`. The picker shows a live contrast badge.*
- `text` — auto-derived from `bg` (light text on dark bg, dark text on light) but overridable.

**Typography (curated pairs only — no free-form font upload)**
- A list of 8 hand-picked display+body pairs, each with a clear personality:
  - "Editorial Nightlife" (Anton + Manrope) — *default*
  - "Magazine" (Fraunces + Manrope)
  - "Brutalist" (Archivo Black + JetBrains Mono)
  - "Refined" (Cormorant Garamond + Inter Tight)
  - "Industrial" (Big Shoulders Display + Sora)
  - "Soft Pop" (Outfit + DM Sans)
  - "Retro Future" (Bebas Neue + Space Mono)
  - "Classic Press" (Playfair Display + Source Sans 3)
- We bundle these via `next/font` with `display: 'swap'` and subset to required glyphs.

**Layout**
- Hero style: `full-bleed-portrait` (default) | `split-portrait-text` | `centered-logo`.
- Section ordering: drag-to-reorder among Bio / Services / Featured Track / Instagram / Gallery / Press Kit.
- Gallery layout: `mosaic` | `uniform-grid` | `carousel`.

**What is NOT customizable (intentional)**
- Spacing scale, type scale, line heights, motion timings — these are locked by the design system to keep every profile looking professional.
- Custom CSS — not in v1; revisit in v2 for power users.

### 12.3 Constraints enforced at save-time
- Contrast: `text` vs `bg` ≥ 4.5:1, `accent` vs `bg` ≥ 3:1 (against large text use).
- If the user picks a combination that fails, save is blocked with an inline explanation pointing to the failing pair.
- The theme record stores raw user input; render-time CSS-variable injection keeps the public profile a single static page (no runtime style recomputation).

---

## 13. Performance Targets

| Metric | Target (mobile, 4G) |
|---|---|
| LCP | < 2.5s |
| INP | < 200ms |
| CLS | < 0.1 |
| TTFB (RSC) | < 600ms p75 |
| Lighthouse Performance | ≥ 95 |
| Total page weight (public profile, first view) | < 600KB compressed (excluding hero image) |

Strategies: RSC, edge caching of public pages, `next/image` with AVIF, font subsetting, deferred IG/SoundCloud embeds (load on intersection).

---

## 14. Security & Privacy

- All credentials (Instagram tokens) encrypted at rest (Supabase pgcrypto).
- RLS enabled on every Supabase table; profiles only writable by their owner.
- Payload admin behind admin-role check + 2FA recommended.
- Rate limiting on auth, slug-availability, and contact endpoints.
- External press kit URLs are validated at save and HEAD-checked daily; we never proxy or rehost user content.
- Privacy policy + cookie consent banner (cookie used only for locale + auth session).
- LGPD compliance for Brazilian users (the reference is in PT-BR, suggesting Brazil is a primary market): clear data export + deletion in account settings.

---

## 15. Analytics & Monitoring

- **Product analytics:** PostHog (self-hosted or cloud) for funnel tracking — signup → first publish → first download.
- **Error tracking:** Sentry on Next.js + Payload.
- **Uptime:** Better Stack or similar for status page.
- **Per-profile analytics:** custom (Supabase `analytics_events` table → simple aggregate queries) — no third-party tracker on public profiles to keep them privacy-friendly and fast.

---

## 16. Pricing & Monetization

**Model:** 14-day free trial, **no card required at signup**. Card required at conversion to paid. No permanent free tier.

| Tier | Price | Includes |
|---|---|---|
| **Trial** | $0 for 14 days · no card required | Full Pro features. Profile is fully functional and publicly accessible during the trial. |
| **Pro (monthly)** | TBD (recommend $9–12/mo) | One profile, custom theme values, all integrations, analytics, no presskit.pro branding in footer. |
| **Pro (annual)** | ~2 months free vs. monthly | Same as Pro monthly, billed yearly. |
| **Agency** | TBD (recommend $29–39/mo) | Up to 10 profiles under one login, profile switcher, consolidated billing. |

**Trial → paid conversion logic:**
- Days 1–14: full access, no card on file, no nag.
- Day 12: in-app reminder + email, prompting card add.
- Day 14: trial ends. If no active subscription → profile flips to `unpublished`. Slug stays reserved for 90 days. Public URL renders a clean "This press kit is paused" page (no 404 — preserves any inbound links).
- Day 90 unpaid: slug reclaimable.
- Card is collected at the moment the user converts (clicks "Continue with Pro"). Stripe Checkout handles the flow.

**Custom domains:** **not in v1.** Moved to v2. v1 ships only `presskit.pro/{slug}` URLs.

---

## 17. Roadmap

### MVP (weeks 1–8) — single-locale, oEmbed integrations only
- Auth (email + Google), onboarding, slug reservation, 14-day trial timer (no card required at signup)
- Profile editor (single locale)
- Default "Editorial Nightlife" theme + Theme tab with color presets, font pair picker, hero style, gallery layout
- Public profile page + sitemap + meta tags
- Photo gallery upload (inline display only)
- **Press kit external link** (Google Drive / Dropbox / etc.) with HEAD validation
- Manual SoundCloud iframe paste (oEmbed)
- Manual Instagram embed paste (oEmbed)
- Marketing landing + pricing page
- Stripe integration for trial → paid conversion (card collected on conversion only)
- Basic analytics (page views, press kit clicks, contact CTA clicks)

### V1 (weeks 9–14) — i18n + polish
- PT/EN content support via locale tabs (cookie-based, no path prefix)
- Daily press kit link health-check job + email alerts
- Annual billing + Agency tier
- Slug reclamation policy (30-day inactivity rule)
- LGPD compliance: data export + delete

### V2 (post-launch)
- Custom domains
- Instagram Graph API connection (auto-pull recent posts) — replaces manual oEmbed for users with Business/Creator accounts
- SoundCloud beyond oEmbed (custom waveform player) if users demand it
- `/explore` directory + search
- Agency multi-profile dashboard
- Booking inquiry inbox
- ES/FR locales
- Custom CSS escape hatch for power users
- Public API for embedding the profile in another site

---

## 18. Resolved Decisions Log

All §18 questions from v0.1 have been resolved:

| # | Question | Decision | Rationale |
|---|---|---|---|
| 1 | Payload + Supabase architecture split | **Payload owns content (Profiles, ProfileContent, Themes, Media metadata, SocialLinks, FeaturedTracks, InstagramConnections). Supabase owns auth, file storage, and analytics events. Payload uses the Postgres adapter pointed at the Supabase database in a dedicated `payload` schema.** | Single Postgres = single source of truth, simpler backups, Payload's localization + drafts map directly to our needs. Schema isolation prevents Payload migrations from colliding with Supabase-managed tables. Spike still recommended in week 1 to confirm. |
| 2 | Instagram Graph API in v1? | **No. v1 ships oEmbed-only manual flow.** Graph API moves to v2. | Most DJs lack a linked Business/Creator + FB Page; oEmbed works for everyone with zero auth and is enough to display the latest posts. |
| 3 | SoundCloud beyond oEmbed? | **No. v1 ships oEmbed-only.** Revisit only if users specifically request a custom player. | SoundCloud's official API is closed to new apps; oEmbed is the supported public path. |
| 4 | Slug squatting | **30-day inactivity reclaim policy.** Verified-artist flow deferred to v2. | Balances first-come-first-served with platform health. Codified in §A. |
| 5 | Trial card requirement | **No card at signup. Card collected at conversion to paid.** | Lower signup friction; conversion happens at a moment of demonstrated intent. |
| 6 | Custom domains in v1 vs v2 | **v2.** v1 ships only `presskit.pro/{slug}`. | Cuts DNS/SSL/cert-renewal infra work out of the MVP. |
| 7 | Locale URL strategy | **Cookie-based, single canonical URL per profile.** No `/{locale}/` path prefix. | Avoids duplicate-content SEO issues; preserves the clean shareable link DJs paste into Instagram bios. |
| 8 | Press kit hosting | **External link only.** DJ provides a Google Drive / Dropbox / etc. URL; we render a CTA that opens it. We do not host or generate ZIPs. | Eliminates storage + bandwidth cost, gives DJ full control over their files, lets them update assets without republishing the profile. Trade-off: we measure clicks not actual downloads, and link rot is handled by daily health checks (§6.5). |

### New risks introduced by these decisions

| # | Risk | Mitigation |
|---|---|---|
| 9 | No-card trial → low conversion rate | Tight Day-12 / Day-14 email + in-app sequence; A/B test card-required variant after 90 days of data. |
| 10 | External press kit links rot silently | Daily HEAD-check job + email alerts on 2 consecutive failures; CTA auto-hidden after 3 failures. |
| 11 | Manual Instagram embed = stale-feeling profiles | Editor nudges DJ to refresh embeds monthly; v2 auto-sync via Graph API will close this. |
| 12 | Cookie-based locale invisible to crawlers without `Accept-Language` heuristics | Server reads `Accept-Language` first, cookie second. `hreflang` tags + content-negotiation `Vary: Accept-Language` header on every public profile response. |

---

## 19. Success Metrics (first 90 days post-launch)

- 500 signed-up users.
- 200 published profiles (40% activation).
- Average time-to-first-publish ≤ 15 minutes.
- 70% of published profiles still active (visited in last 30 days) after 60 days.
- Median public-profile Lighthouse score (Performance) ≥ 95 mobile.
- Zero critical a11y violations on automated `axe-core` runs in CI.

---

## Appendix A — URL slug rules

- Lowercase a–z, 0–9, hyphens. Min 3, max 30 characters.
- Cannot start/end with hyphen, no consecutive hyphens.
- Reserved list (see §5).
- Profanity filter (English + Portuguese baseline).
- Once published, slug changes require a 301 redirect from the old slug for 90 days.

## Appendix B — Locale fallback matrix

| Visitor's `Accept-Language` | Profile's available locales | Served locale |
|---|---|---|
| pt-BR | [pt, en] | pt |
| pt-BR | [en] only | en (with banner: "Original in English") |
| en-US | [pt, en] | en |
| any other | [pt, en] | profile's `defaultLocale` |

## Appendix C — Definition of Done (per feature)

A feature is "done" when:
1. Lives behind a feature flag if risky.
2. Has unit tests on business logic.
3. Has a Playwright E2E for the happy path.
4. Passes `axe-core` automated a11y check.
5. Has translated strings for all launch locales.
6. Documented in the internal handbook.
7. Has been manually QA'd on iPhone Safari, Android Chrome, desktop Chrome, Firefox.
