# Task 01 — Project Setup & Tooling Scaffold

## Summary
Bootstrap the Next.js (App Router) + TypeScript + Tailwind monorepo-friendly workspace with strict typing, formatting, and the empty Payload CMS instance ready to receive collections.

## PRD references
- §1 (Tech stack), §8 (Tech architecture), §11 & §13 (a11y / perf targets imply tooling).

## Dependencies
None — this unblocks everything.

## Scope (in)
- Next.js 14+ App Router, TypeScript strict, ESLint + Prettier, Tailwind CSS, `next/font`, `next-intl` skeleton (no locales wired yet — done in task-29).
- TanStack Query provider in a client boundary.
- Payload CMS scaffolded with Postgres adapter pointing at the local Supabase instance, on a dedicated `payload` schema.
- `.env.example` with every variable the app expects (no real secrets committed).
- Local dev script (`pnpm dev`) starts Next + Payload concurrently.

## Scope (out)
- Any production deployment config (handled by task-04).
- Any feature work (auth, editor, public page).

## Acceptance criteria
- [ ] `pnpm install && pnpm dev` brings up Next on `:3000` and Payload admin on `/admin`.
- [ ] `pnpm typecheck` and `pnpm lint` pass on a clean clone.
- [ ] Tailwind purges correctly; an unused class produces zero CSS in the build.
- [ ] Payload connects to Postgres in the `payload` schema; Supabase migrations in `public` schema are unaffected.
- [ ] README documents the dev workflow in ≤ 20 lines.

## Implementation notes
- Use `pnpm` (lockfile committed).
- Strict TS: `"strict": true`, `"noUncheckedIndexedAccess": true`.
- Add `@typescript-eslint`, `eslint-plugin-jsx-a11y`, `eslint-config-next`.
- Tailwind: enable `content` globs for `app/`, `components/`, `payload/` (server-only files only — never ship Payload CSS to the client).
- TanStack Query: single root provider in `app/providers.tsx`, `staleTime: 30_000` default.
- **Root `package.json` MUST have `"type": "module"`.** Payload v3.x is fully ESM and uses `tsx/esm/api` to load `payload.config.ts`. Without `"type": "module"`, tsx compiles the config as CJS, and any sync require of Payload's own ESM packages explodes with `ERR_REQUIRE_ASYNC_MODULE` (top-level await in the graph). Wire `cross-env` for cross-platform `NODE_OPTIONS`, but the actual fix is the `type` field.

## Definition of Done
Per PRD Appendix C — applies once feature work begins layering on. For this scaffold task: typecheck + lint clean, README written, environments parity documented.
