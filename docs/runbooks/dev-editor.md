# Dev — Profile editor

The editor lives at `/dashboard/profile/[id]`. The seeded demo profiles all have synthetic owners (`seed-demo-*` supabaseUserId), which means **you can't open them as the seed-owner** — Supabase Auth doesn't have those users. Use one of these paths:

## Open the editor against your own profile

The fastest path is to walk through `/onboarding` with the dev magic-link bypass, then click "Abrir editor" on the dashboard:

```bash
pnpm dev:magic-link e2e+$(date +%s)@your-domain.com --next=/onboarding
```

Open the printed URL in a private window, complete the 5 wizard steps, and you'll land on `/dashboard/profile/<id>`.

## Re-assign a seeded demo profile to your own user

Useful when you want to test the editor against richer data than a fresh wizard run:

```sql
-- 1. Find your Payload user id.
select id, email, supabase_user_id
from payload.users
where supabase_user_id = '<your supabase auth.users.id>';

-- 2. Re-assign one of the demo profiles to you.
update payload.profiles
set owner_id = <your-payload-user-id>
where slug = 'mariana-luz';
```

Now `/dashboard/profile/<that profile id>` opens for you.

## Capture an `EDITOR_E2E_COOKIE`

Same drill as `dev-onboarding.md` — DevTools → Application → Cookies → copy the `sb-<ref>-auth-token` value.

```bash
EDITOR_E2E_COOKIE='<cookie>' EDITOR_E2E_PROFILE_ID=<id> \
  pnpm test:e2e --grep "@full"
```

## Test the hero editor (task-10)

1. Open the editor against a re-assigned demo profile (above).
2. Click the **Hero** rail item (it's first by default).
3. Upload a JPEG portrait → confirm it appears in the preview and the SaveStatus flips `Salvando... → Salvo · há Xs`.
4. Type alt text — without it, the inline `role="alert"` shows "Texto alternativo é obrigatório".
5. Switch hero styles — the preview re-lays-out (full-bleed, split, centered-logo) without re-uploading.
6. Pick a CTA preset ("Book now"); the label persists. Switch to "Personalizado" and type your own.
7. Paste a CTA URL (try `https://wa.me/5511999999999`, `mailto:press@x.com`, or a plain `https://...`). Invalid schemes (`javascript:`, `ftp://`) surface an inline error.

To force compression: drop a > 2MB JPEG. The dev tools Network tab shows the PUT body is much smaller than the original (Canvas-resized to 2400px / quality 0.82).

## Test the bio + services editors (task-11)

1. Open the editor; click the **Sobre** rail item.
2. The empty-state prompts ("Como você descreve sua música?", etc.) appear when the bio is empty.
3. Type some text and try the toolbar: H2 / H3 headings, bold, italic, ordered + unordered lists, link.
4. **Paste sanitization:** copy a fragment from Google Docs or a styled webpage and paste into the editor. The output should NOT carry inline styles, classes, or fonts. Verify with React DevTools — the Lexical state JSON has plain `paragraph` / `heading` / `list` nodes only.
5. Switch to **Serviços**; click "+ Adicionar serviço". Empty title shows `Título é obrigatório.`
6. Add 8 items — the add button disables and the "Máximo 8 serviços" helper appears.
7. Drag-reorder a row by its `⋮⋮` handle; the preview reflects the new order.
8. Both editors flush via autosave (5s) into `/api/profiles/[id]/content`.

## Test the photo gallery editor (task-12)

1. Open the editor; click **Galeria** in the rail.
2. Drop 3+ JPEGs onto the dropzone (or click to pick). The upload queue shows phase progress per file: `Comprimindo... → Enviando... → Salvando... → Pronto`.
3. Each finished photo lands in the grid. Edit alt text per photo; toggle "Decorativa" for a couple.
4. Decorative photos render with `alt=""` on the public side — verify in DevTools by inspecting the `<img>` tag.
5. Drag-reorder via the `⋮⋮` handle. The preview reflects the new order.
6. Multi-select via the checkboxes (top-left of each card) → "Excluir selecionadas" → confirm → both Storage objects + Payload Media rows go.
7. Soft-cap kicks in above 24 photos (warning); hard-cap at 50 (dropzone disabled).
8. To verify AVIF conversion: open DevTools Network tab and watch the PUT request — file extension should be `.avif` on modern browsers (Safari 15 falls back to `.jpg`).

## Test the social-links editor (task-13)

1. Open the editor; click **Redes sociais** in the rail.
2. Click "+ Adicionar link". A new row appears with the first available platform pre-selected.
3. Switch the platform `<select>` (Instagram → WhatsApp). Try each input shape:
   - `@dj_x` (handles) — auto-canonicalized client-side.
   - Full URL with query (`https://instagram.com/dj_x?utm=foo`) — query stripped, host normalized.
   - `+55 11 99999-9999` for WhatsApp — non-digits stripped, `wa.me/<digits>` produced.
   - `dj@example.com` for E-mail — re-saved as `mailto:dj@example.com`.
4. Type a bad value (`not-a-url`, or a WhatsApp number missing the country code). The row's input gets `aria-invalid="true"` and a "Como encontrar a URL do {platform}" helper link appears. The top of the card shows a `role="alert"` banner.
5. Drag-reorder a row by its `⋮⋮` handle; the preview reflects the new order.
6. Add 10 rows — "+ Adicionar link" disables and the "Máximo 10 links" helper appears.
7. Save flush goes to `PUT /api/profiles/[id]/social-links`. Defense-in-depth: the route re-runs `parseAndCanonicalize` server-side and stores the canonical URL even if a client somehow bypasses validation.
8. Refresh — `displayOrder` (rewritten from array index server-side) restores the same order.

## Test the contact editor (task-14)

1. Open the editor; click **Contato** in the rail.
2. Type a WhatsApp number in any of these forms — all canonicalize on blur to `https://wa.me/<digits>`:
   - `+55 11 99999-9999`
   - `5511999999999`
   - `https://wa.me/5511999999999`
3. Type an email — canonicalizes to the bare address (display) but is stored that way; the public render adds `mailto:` back.
4. Toggle **Ativar formulário na página pública**. The "Destino das mensagens" input appears with the contact email as placeholder/default.
5. Open the public preview — buttons + form render. Submit a valid message → 200; check the dev server logs for `[contact-form] RESEND_API_KEY unset — message NOT delivered:` (the placeholder log line).
6. Submit 6× rapidly from the same IP → the 6th hits 429 with a `Retry-After` header. The form surfaces "Muitas tentativas. Tente novamente em Xs."
7. Honeypot smoke test: in DevTools, set the hidden `<input>` value to `"bot"` and submit → server returns 200 silently and **no email log appears**.

### Live Turnstile + Resend smoke

Once you've set `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, and `RESEND_API_KEY` in `.env`:

1. Restart `pnpm dev` so Next.js picks up the new public env var (it's inlined at build time).
2. Open the public profile in a browser. The Turnstile widget renders below the message textarea; the **Enviar mensagem** button is disabled until the widget reports a token.
3. Submit a valid message — should produce a real email in the `contactFormDestination` mailbox within seconds (Resend's dashboard also shows the delivery).
4. Submit a second time without solving a fresh challenge → server returns 400 `error: 'captcha'` (Cloudflare consumes the token on `siteverify`). The form auto-resets the widget on each error.
5. Verify rate-limit: 6× rapid submits from the same IP → 6th hits 429 with `Retry-After`.

**If Turnstile shows "Invalid hostname":** add the host to the site's allow-list in the Cloudflare dashboard — see `.env.example` for the list (`localhost`, `presskit.pro`, `*.vercel.app`).

**If you get 400 `error: 'captcha'` on every submit:** confirm `TURNSTILE_SECRET_KEY` matches the secret for the site whose `NEXT_PUBLIC_TURNSTILE_SITE_KEY` you're using. They're a paired credential.

To temporarily disable the captcha for debugging, blank `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (form bypasses the gate) **and** `TURNSTILE_SECRET_KEY` (route reverts to no-op). Both, or neither — never one.

## Test the press-kit editor (task-15)

1. Open the editor; click **Press kit** in the rail.
2. Paste a publicly-viewable URL (Google Drive, Dropbox, Notion, etc.) and click **Validar**.
3. On success the green check shows the recognized provider chip ("Link válido — Google Drive"). The autosave fires immediately and a `PATCH /api/profiles/<id>` lands with `{ pressKitUrl: "..." }`. Server-side, the `derivePressKitProvider` beforeChange hook re-derives `pressKitProvider` (so even if the editor is bypassed, the provider stays in sync with the URL).
4. Try a 404 URL (e.g. `https://example.com/missing`) — `Validar` flips the input `aria-invalid` and shows "Não encontramos esse arquivo (HTTP 404)". `onMutate` is **not** called → nothing persists.
5. **Drive restrictive-access quirk:** paste a Drive link whose page renders the "Access denied" title. The widget still saves (the file might be public for some collaborators), but a "Pode estar restrito a usuários do workspace" warning appears. Verify by opening the link in an incognito window.

### How the validation route works

- The editor calls `POST /api/press-kit-validate` with `{ url }`.
- The route runs `validatePressKitUrl()`: `HEAD` with an 8s timeout, falls back to a `Range: bytes=0-0` GET if the host returns 405, and probes the body for the Drive "Access denied" title when `provider === 'google-drive'`.
- The PATCH route (`/api/profiles/<id>`) does **not** re-validate — that would block autosave on every keystroke. Drift gets caught by the daily health-check cron in task-30.

### Public render behavior

- The CTA renders with `target="_blank" rel="noopener noreferrer"` and a provider badge ("Hospedado no Dropbox", etc.) when the provider is recognized.
- Click fires `track('press_kit_click', { provider, profileSlug })`. The PostHog sink ships in task-24; until then the event logs to `console.debug`.

## Test the featured-track editor (task-16)

1. Open the editor; click **Faixa em destaque** in the rail.
2. Paste any public SoundCloud track or playlist URL (e.g. `https://soundcloud.com/forss/flickermood` is a known-public test).
3. Click **Salvar**. The route fetches `https://soundcloud.com/oembed?url=...&format=json`, runs the response `html` through `extractSafeIframe` (rebuilds the iframe with our own attrs — never passes the upstream string through), and persists the result on `FeaturedTracks.oembedHtml` + `fetchedAt`.
4. The "Pré-visualização" panel renders the embedded player. The right-side preview pane mounts the same iframe via `<LazyIframe>` (IntersectionObserver-deferred — only mounts when the section is in/near the viewport).
5. Click **Atualizar embed** to force a re-fetch (sends `force: true`). Useful when SoundCloud's cached HTML drifts.
6. Click **Remover** to clear the row entirely (DELETE on the same route).

### Known good test URLs

- `https://soundcloud.com/forss/flickermood` — short instrumental, no login required.
- `https://soundcloud.com/odesza/sun-models-feat-madelyn-grant` — playlist-friendly.

### Common errors

- **`Não encontramos essa faixa (404)`** — the SoundCloud URL is private, deleted, or the user pasted a non-soundcloud.com URL.
- **`Apenas links do soundcloud.com são aceitos`** — host check in `fetchSoundcloudOembed` rejected the URL before any network call.
- **`Resposta do SoundCloud não pôde ser processada com segurança`** — the upstream `html` field is missing or its iframe `src` doesn't match `https://w.soundcloud.com`. We refuse to render it.

## Test the Instagram editor (task-17)

1. Open the editor; click **Instagram** in the rail.
2. Click **+ Adicionar post**, paste a public IG post URL (e.g. `https://www.instagram.com/p/<shortcode>/` or `/reel/<id>/`), and click **Salvar**.
3. The route hits `PUT /api/profiles/<id>/instagram-posts`. Server-side, each URL goes through `parseInstagramPostUrl` (host + path validation), then `fetchInstagramOembed`:
   - **With `INSTAGRAM_OEMBED_ACCESS_TOKEN` set**: hits Meta's Graph oEmbed; returns a sanitized iframe.
   - **Without the token**: builds the canonical `<blockquote class="instagram-media">` server-side. The browser loads `https://www.instagram.com/embed.js` once and hydrates each blockquote into the real iframe.
4. The right-side preview pane mounts each post via `<LazyEmbed>` (intersection-deferred, same pattern as task-16's featured track).
5. After 7 days the editor row shows a "Recomendado atualizar" hint. Click **Atualizar** on that row to force a re-fetch (sends `force: true`).
6. Adding a 7th post is blocked at the UI cap; the route also rejects with `400 too-many` if a client somehow bypasses it.
7. Removing all posts hides the public Instagram section entirely (no empty grid, per spec AC).

### Wiring the Graph path (optional)

The blockquote fallback is enough for v1. To switch to the higher-fidelity Graph oEmbed (returns a true `<iframe>` server-side, no client-side hydration needed):

1. Register a Facebook app at <https://developers.facebook.com/apps>.
2. Add the **oEmbed Read** permission and generate a long-lived app access token.
3. Set `INSTAGRAM_OEMBED_ACCESS_TOKEN=...` in `.env`. **Restart `pnpm dev`.**
4. Re-save any post; the response now uses the Graph path. If the Graph endpoint ever 404s, malformed-responses, or times out, the route silently falls back to the blockquote — saves never fail because of a Meta hiccup.

### Common errors

- **`Apenas links do instagram.com são aceitos.`** — host check rejected the URL.
- **`Use o link de um post (`/p/`, `/reel/`, `/tv/`).`** — pasted a profile / explore page.
- **`Limite de 6 posts atingido.`** — server-side cap hit.

## Test the Theme tab + contrast gate (task-18)

1. Open the editor; click the **Tema** tab strip at the top of the left column. (Mobile users see it under the same toggle.)
2. Pick a BG preset (e.g. **Paper White**) and an Accent preset (e.g. **Cobalt**). The right-side preview pane changes color immediately — tokens are injected as CSS variables on the rendered article (`--bg`, `--accent`, `--accent-contrast`, `--text`).
3. The "Contraste" panel always shows ratios for **text / bg** and **accent / bg**. Pass thresholds: 4.5:1 and 3:1.
4. Try a low-contrast custom hex pair (e.g. bg `#ffffff`, accent `#eeeeee`). The `role="alert"` banner appears: "Contraste insuficiente. Ajuste os valores acima…". The autosave still saves the colors so the user can keep iterating.
5. **Server-side gate:** every theme PATCH that touches a color field re-runs `validateThemeContrast`. On pass, the route bumps `Themes.contrastValidatedAt`. On fail, the timestamp is left alone.
6. **Publish gate:** `POST /api/profiles/<id>/publish` checks `contrastValidatedAt`. If null or > 30 days, returns `422 contrast-stale`. The editor surfaces this as a toast on the bottom-right: "O tema precisa ser revalidado…". Re-pick a passing preset on the Tema tab → autosave fires → server bumps the timestamp → Publicar works.

### Verifying the toast / gate manually

To force the publish gate to fire even on a passing theme, manually clear `contrastValidatedAt` in Postgres:
```sql
update payload.themes set contrast_validated_at = null where profile_id = <id>;
```
Click **Publicar** → 422 lands → toast shows. Re-validate on the Tema tab to clear it.

## Test the public profile route (task-19)

1. Publish a profile via the editor (Theme tab green → **Publicar**).
2. Visit `http://localhost:3000/<your-slug>` in a private window.
3. Confirm:
   - Single `<h1>` is the artist's display name (slug → spaces).
   - The sticky **AnchorNav** at the top has links to Sobre / Serviços / Galeria / Faixa / Press kit / Contato — only the ones with content.
   - Clicking an anchor scrolls smoothly to the matching section (CSS `scroll-behavior: smooth` + `scroll-padding-top: 4rem` to clear the sticky nav). With `prefers-reduced-motion`, the scroll is instant.
   - The page emits `Vary: Accept-Language` (DevTools Network → Headers).
   - Hero portrait loads via `next/image` (`<img>` has `data-nimg`), `priority`, explicit dimensions → no CLS.
4. Visit a slug that doesn't exist or is in draft → branded 404 page (`app/[slug]/not-found.tsx`).
5. **Revalidation smoke:** with the public page open in tab A and the editor in tab B, change the tagline and click **Publicar** → tab A reflects the change after a refresh within 5s. (The Profiles `afterChange` hook fires `revalidatePath('/<slug>')`.)

### Trial-paused state (TODO, task-31)

Today, paused / trial-expired profiles 404 just like missing ones. The branded paused page lands when billing fields exist (task-31).

## Test the SEO foundation (task-20)

1. **Robots:** open `http://localhost:3000/robots.txt`. Expect `User-Agent: *`, `Allow: /`, and `Disallow:` lines for `/dashboard/`, `/api/`, `/admin/`, `/onboarding/`, `/login`, `/signup`, `/auth/`, `/dev/`, `/spike`. The `Sitemap:` line should point at `<NEXT_PUBLIC_APP_URL>/sitemap.xml`.
2. **Sitemap:** open `http://localhost:3000/sitemap.xml`. Each published profile gets a `<url>` with the canonical `https://<host>/<slug>`, `<lastmod>` reflecting the row's `updatedAt`, weekly `<changefreq>`, priority 0.7. Drafts are absent.
3. **JSON-LD:** on a published profile page, view source and search for `<script type="application/ld+json">`. The body parses to a `MusicGroup` object with `name`, `url`, optional `description`, optional `image`, and a `sameAs` array of social/featured-track/press-kit URLs.
4. **Rich Results Test:** copy the public URL and paste it into <https://search.google.com/test/rich-results>. The MusicGroup should pass with no errors.
5. **Canonical:** view source on the page; the `<link rel="canonical" href="https://.../<slug>">` tag should never carry a locale segment.
6. **hreflang alternates:** the `<head>` contains one `<link rel="alternate" hreflang="...">` per locale in `Profiles.localesAvailable`, plus `x-default`. All point at the same canonical URL — same-URL hreflang is valid per Google's docs.
7. **Sitemap revalidation:** publish or unpublish a profile; the next request to `/sitemap.xml` reflects the change. The Profiles `afterChange` hook fires `revalidatePath('/sitemap.xml')` whenever the publication state shifts.

## Mock autosave failures for QA

The PATCH route returns 400 / 404 for invalid bodies / access denials. To force an error UI without changing code, point the PATCH at a non-existent id via the browser devtools (Network → "Override response"). The `SaveStatus` component should flip to the error state with a "tentar de novo" button.

## Reset a profile to draft

```sql
update payload.profiles set status = 'draft' where id = <id>;
```

Re-publish from the editor to confirm the ISR revalidation hook fires and the public route would update (the public route ships in task-19 — for now `/{slug}` returns 404).
