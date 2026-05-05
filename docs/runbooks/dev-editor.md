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

## Mock autosave failures for QA

The PATCH route returns 400 / 404 for invalid bodies / access denials. To force an error UI without changing code, point the PATCH at a non-existent id via the browser devtools (Network → "Override response"). The `SaveStatus` component should flip to the error state with a "tentar de novo" button.

## Reset a profile to draft

```sql
update payload.profiles set status = 'draft' where id = <id>;
```

Re-publish from the editor to confirm the ISR revalidation hook fires and the public route would update (the public route ships in task-19 — for now `/{slug}` returns 404).
