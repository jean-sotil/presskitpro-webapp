# PressKit Pro

Next.js 15 + Payload 3 + Tailwind on Postgres (Supabase).

## Prerequisites
- Node `20.9+` (see `.nvmrc`) · pnpm `9+`
- Postgres (recommended: `supabase start`)

## Develop
```bash
cp .env.example .env       # set DATABASE_URI + PAYLOAD_SECRET
pnpm install
pnpm dev                   # Next :3000 · Payload admin /admin
```

## Verify
```bash
pnpm typecheck && pnpm lint && pnpm build
```
First admin user is bootstrapped at `/admin` on initial visit.
