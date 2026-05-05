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

## Mock autosave failures for QA

The PATCH route returns 400 / 404 for invalid bodies / access denials. To force an error UI without changing code, point the PATCH at a non-existent id via the browser devtools (Network → "Override response"). The `SaveStatus` component should flip to the error state with a "tentar de novo" button.

## Reset a profile to draft

```sql
update payload.profiles set status = 'draft' where id = <id>;
```

Re-publish from the editor to confirm the ISR revalidation hook fires and the public route would update (the public route ships in task-19 — for now `/{slug}` returns 404).
