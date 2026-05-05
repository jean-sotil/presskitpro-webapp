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

## Mock autosave failures for QA

The PATCH route returns 400 / 404 for invalid bodies / access denials. To force an error UI without changing code, point the PATCH at a non-existent id via the browser devtools (Network → "Override response"). The `SaveStatus` component should flip to the error state with a "tentar de novo" button.

## Reset a profile to draft

```sql
update payload.profiles set status = 'draft' where id = <id>;
```

Re-publish from the editor to confirm the ISR revalidation hook fires and the public route would update (the public route ships in task-19 — for now `/{slug}` returns 404).
