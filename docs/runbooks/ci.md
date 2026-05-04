# Runbook — CI / CD

Implements [task-04](../tasks/task-04-ci-cd-and-quality-gates.md). The workflow lives at [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml).

## What runs on every PR

```
┌─ gates (parallel matrix, ~2 min) ─────────────────────┐
│  ├─ typecheck   (tsc --noEmit)                        │
│  ├─ lint        (next lint)                           │
│  ├─ unit-test   (vitest run)                          │
│  └─ contrast    (78/12 OKLCH preset matrix vs WCAG)   │
└────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─ build (~3-5 min) ──────────────────────────────┐
│  next build → uploads .next as run artifact     │
└──────────────────────────────────────────────────┘
                       │
       ┌───────────────┴───────────────┐
       ▼                               ▼
┌─ e2e (~3-5 min) ─────────┐   ┌─ lighthouse (~2-3 min) ─┐
│  Playwright smoke        │   │  perf / a11y / BP / SEO │
│  + @axe-core/playwright  │   │  budgets per PRD §13    │
│  → playwright-report.zip │   │  → public report link   │
└───────────────────────────┘   └──────────────────────────┘
                       │
                       ▼
┌─ summary ──────────────────────┐
│  fails the run if any job did  │
└────────────────────────────────┘
```

Total wall time on a clean PR: **~8–10 minutes**.

## Required GitHub repo secrets

Settings → Secrets and variables → Actions → New repository secret:

| Secret | Value source |
|---|---|
| `DATABASE_URI` | Supabase dashboard → Settings → Database → Direct connection (port 5432). |
| `PAYLOAD_SECRET` | `openssl rand -base64 48` — independent of dev `.env`. |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → `anon public`. |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → `service_role` (server-only). |
| `SUPABASE_AUTH_WEBHOOK_SECRET` | `openssl rand -hex 32` — match what's set in the hosted DB's `app.webhook_secret` if you want CI's webhook tests to work; otherwise any value is fine for now. |

> The hosted **dev** Supabase project is what CI talks to. There is no production database yet (task-23 onward); when it lands, add a parallel set of `PROD_*` secrets and a separate workflow.

## Debugging a failed gate

| Job is red | Check |
|---|---|
| `typecheck` | `bun run typecheck` locally — same command. |
| `lint` | `bun run lint`. |
| `unit-test` | `bun run test`. The matrix output names the failing spec. |
| `contrast` | `bun run contrast:check` — output lists the failing bg×accent combos with their ratios. |
| `build` | Re-run locally with the same env vars. Most failures are env-missing or migration drift. |
| `e2e` | Download the `playwright-report` artifact from the run. `bun run test:e2e:ui` locally to repro interactively. |
| `lighthouse` | The action prints a public URL with the full report; click through to see which audit failed. Tighten/loosen thresholds in [`lighthouserc.json`](../../lighthouserc.json) if they're wrong, but **don't loosen perf/a11y to make a real regression go away** — fix the regression. |

## Phase B — operator setup (deferred from task-04)

These need GitHub UI / Vercel UI access, so the AI can't land them automatically. They're not blockers for merging PRs once the secrets above are set.

### B1 — Branch protection

1. Settings → Branches → Add rule for `main`.
2. ☑ Require a pull request before merging.
3. ☑ Require status checks to pass before merging.
4. Search and add: `ci summary`. (That's the consolidated job; selecting it is enough — it transitively requires every upstream job.)
5. ☑ Require branches to be up to date before merging.
6. ☑ Do not allow bypassing the above.

### B2 — Vercel preview deploys per PR

1. Vercel dashboard → Add new → Project → Import the GitHub repo.
2. Framework preset: **Next.js**.
3. In Vercel project settings → Environment Variables, add the same secrets as above (with the **Preview** scope, plus **Production** for the prod-deploy story below).
4. Generate a Vercel deploy token: Vercel → Account Settings → Tokens. Add it to GitHub repo secrets as `VERCEL_TOKEN`. Also add `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` (from the project's `.vercel/project.json` after running `vercel link` locally).
5. Open a placeholder PR — Vercel auto-creates a preview deploy URL; the bot comments with the link.

> A `.github/workflows/vercel-preview.yml` workflow can wire this further (e.g., re-run Playwright against the live preview URL). Not added in Phase A — would just sit broken until the project exists. Add it in a follow-up PR once Vercel is linked.

### B3 — Production deploy on tag push

After B2 is live, Vercel handles `main` → production automatically. To gate prod deploys behind explicit tags, change Vercel project settings → Git → Production Branch from `main` to a tag pattern, OR add a workflow that calls `vercel deploy --prod` only on tag push.

### B4 — Lighthouse 95 on a seeded profile

The current [`lighthouserc.json`](../../lighthouserc.json) gates only the home page at perf ≥ 80. The PRD AC of "≥ 95 on a seeded profile" needs:

1. Task-19 lands `app/[slug]/page.tsx` (public profile).
2. A seed script populates one demo profile (e.g., `/demo`).
3. Update `lighthouserc.json` `collect.url` to include `http://localhost:3000/demo` and tighten perf to ≥ 95.

Tracked in task-19's plan; this runbook references it so it's not forgotten.

## When to update this runbook

- Any new CI job, secret, or workflow file → mention it here.
- Any change to the Phase B steps (Vercel UI, branch protection toggles) → update the screenshots/copy.
- New deferred ACs → add them under Phase B with a clear owner.
