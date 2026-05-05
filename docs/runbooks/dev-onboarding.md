# Dev — Onboarding wizard reset

Quick recipes for testing the onboarding wizard against the dev hosted Supabase project.

## Reset a single user's wizard

Connect with `psql $DATABASE_URI` (or use the Supabase SQL editor) and run:

```sql
update payload.users
set onboarding_progress = null
where email = 'you@example.com';

-- Optional: also delete the profile that was created on completion,
-- so the dashboard redirects back to /onboarding.
delete from payload.profiles
where owner_id = (
  select id from payload.users where email = 'you@example.com'
);

-- Optional: release any active slug hold for the user.
delete from public.slug_reservations
where held_by_user_id = (
  select supabase_user_id from payload.users where email = 'you@example.com'
);
```

After this the user lands on `/onboarding/1` on their next dashboard visit.

## Mint a fresh test user without sending email

The dev magic-link bypass (task-05) generates a sign-in URL without the SMTP step:

```bash
pnpm dev:magic-link e2e-test+$(date +%s)@your-domain.com --next=/onboarding
```

Open the printed URL in a private window and step through the wizard. Each timestamp creates a new auth.users row; the auth-sync webhook mirrors it into `payload.users` automatically.

## Capture an E2E session cookie

The `tests/e2e/onboarding.spec.ts` `@full` cases skip unless `ONBOARDING_E2E_COOKIE` (a fresh, empty-state user's `sb-...` cookie) is set. Easiest path:

1. `pnpm dev:magic-link e2e+$(date +%s)@your-domain.com`.
2. Open the URL in a clean browser context, complete sign-in.
3. DevTools → Application → Cookies → copy the value of the `sb-<ref>-auth-token` cookie.
4. Run: `ONBOARDING_E2E_COOKIE='<cookie value>' pnpm test:e2e --grep "@full"`.

Re-run after each test (the user is no longer "empty state" once the wizard completes).

## Reset everyone's wizard (CI smoke prep)

```sql
update payload.users
set onboarding_progress = null;
delete from payload.profiles;
delete from public.slug_reservations where type = 'soft_hold';
```

Heavy hammer — only run against ephemeral CI databases.
