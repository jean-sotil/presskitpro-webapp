# Task 04 — Implementation Plan (RFC-Lite)

> Architectural artifact for [task-04-ci-cd-and-quality-gates.md](./task-04-ci-cd-and-quality-gates.md).
> Authored under the Maestro protocol. Length: < 300 lines (Anti-Novel Rule).

## Why

Establish the automated quality bar every future PR must clear: typecheck, lint, unit tests, design-system contrast, build, e2e (Playwright + axe), and Lighthouse budgets. Several PRD ACs depend on infra outside this task (Vercel preview deploys, branch protection, real public-profile route) — those land in **Phase B** with explicit pre-conditions documented.

## Decisions locked (Socratic Gate)

| # | Axis | Decision | Rationale |
|---|---|---|---|
| 1 | CI provider | **GitHub Actions** | Free, native to the repo, no extra accounts. |
| 2 | Hosting / preview | **Vercel** (Phase B — needs operator setup) | Canonical for Next.js 15 + Payload; matches PRD's PR-preview model. |
| 3 | PR preview DB | **Shared hosted Supabase dev project** (already provisioned), `seed.sql` reset before each Playwright run | Simpler than ephemeral-per-PR. PRs aren't DB-isolated but seed makes tests deterministic. |
| 4 | Axe runner | **`@axe-core/playwright`** — axe inside e2e tests | One tool, one report. |
| 5 | Lighthouse runner | **`@lhci/cli` + budget file** + `treosh/lighthouse-ci-action` | Stable, de-facto. |
| 6 | Playwright scope | **Smoke on PR, full on main** | PR feedback under 5 min. |
| 7 | CI env values | **Hosted Supabase keys as GitHub Actions secrets** | The hosted dev project has no prod data; safe to consume in CI. |

## Cross-references

- PRD §11 (a11y) — every key route axe-clean.
- PRD §13 — performance targets: LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1, Lighthouse ≥ 95.
- PRD §19 — success metrics include zero critical axe violations.
- PRD Appendix C — DoD per feature.
- task-03 plan — the only existing test infrastructure (Vitest); we extend it here.

## File inventory (deliverables)

### CI workflows (`.github/workflows/`)

- `ci.yml` — runs on `pull_request` and `push: main`. Jobs:
  1. `gates` (parallel: `typecheck`, `lint`, `unit-test`, `contrast:check`)
  2. `build` (depends on `gates`; produces `.next/` artifact for downstream)
  3. `e2e` (depends on `build`; runs Playwright + axe against `bun run start`)
  4. `lighthouse` (depends on `build`; runs `@lhci/cli` against `bun run start`)
  5. `summary` (always runs; aggregates pass/fail for branch-protection rule)
- `vercel-preview.yml` (**stub, Phase B**) — kept commented-out with a TODO referencing the Vercel-setup runbook.

### Playwright

- `playwright.config.ts` — config, base URL `http://localhost:3000`, retries on CI, HTML reporter, single worker on CI.
- `tests/e2e/smoke.spec.ts` — `/` and `/dev/preview` render without errors; `@axe-core/playwright` runs on `/` and asserts zero critical/serious violations. (`/dev/preview` is dev-only so axe runs there in dev mode but only the home page enforces axe in production-build CI.)
- `tests/e2e/fixtures/axe.ts` — small wrapper that filters axe results to `critical | serious` and pretty-prints failures.

### Lighthouse-CI

- `lighthouserc.json` — `assertions` block with PRD §13 budgets (perf ≥ 95, a11y ≥ 95, BP ≥ 95, SEO ≥ 95, CLS ≤ 0.1, INP/TBT thresholds). `collect.numberOfRuns: 3`. URL list: `http://localhost:3000/`. (Public-profile URL is added in task-19.)

### Scripts

- `package.json` adds:
  - `"test:e2e": "playwright test"`
  - `"test:e2e:ui": "playwright test --ui"`
  - `"lighthouse": "lhci autorun"`

### Docs

- `docs/runbooks/ci.md` — what each job does, how to read the output, how to debug failures, how to set up Vercel + branch protection (Phase B).
- Update `docs/tasks/task-04-*.md` Status block with Phase A completion + explicit Phase B deferrals and pre-conditions.

### Dependencies (dev)

- `@playwright/test` + `playwright` (browsers cached in CI via `~/.cache/ms-playwright`).
- `@axe-core/playwright`.
- `@lhci/cli` (dev only — CI runs it via the Action).

## Implementation sequence

1. **Install + scaffold Playwright.** `bun add -d @playwright/test @axe-core/playwright @lhci/cli`. Run `bunx playwright install --with-deps chromium` locally. Generate `playwright.config.ts`.
2. **Smoke spec, TDD-style.** Write `smoke.spec.ts` first (will fail until Playwright is configured + dev server can start in CI). Confirm it runs locally green via `bun run dev` background + `bunx playwright test`.
3. **Axe wrapper + assertion.** Add `tests/e2e/fixtures/axe.ts`; smoke spec uses it on `/`. Confirm zero violations on the existing home page (which is the placeholder — easy win).
4. **Lighthouse config.** Write `lighthouserc.json` with conservative budgets initially (perf ≥ 80) so the placeholder home page passes; tighten to ≥ 95 in a follow-up commit when we have a real page.
5. **CI workflow.** Author `ci.yml`. Each job uses `oven-sh/setup-bun@v2`. Cache `node_modules` and `~/.cache/ms-playwright` via `actions/cache`. Build artifact passed via `actions/upload-artifact` → `download-artifact`.
6. **Secrets contract.** Document in `docs/runbooks/ci.md` exactly which secrets the workflow expects (`DATABASE_URI`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `PAYLOAD_SECRET`, `SUPABASE_AUTH_WEBHOOK_SECRET`). Operator sets these in GitHub repo settings.
7. **Phase B docs.** Write the Vercel-setup walk-through and branch-protection toggle list in the runbook so the operator can complete Phase B in one sitting.

## Acceptance evidence (Verification Matrix)

| AC (from task) | Status this task | How to verify |
|---|---|---|
| TS error fails CI in < 3 min | ✅ Phase A | Open a PR introducing `const x: number = 'oops'`; CI red within 3 min on `gates` job. |
| Lighthouse < 95 fails CI on seeded profile | 🚧 deferred to task-19 | Initial budget is perf ≥ 80 on `/`; tighten + extend to profile route in task-19. |
| Playwright runs against ephemeral preview env with seed | 🟡 partial | Phase A: Playwright runs against locally-built `bun run start` with shared Supabase. Ephemeral-per-PR is Phase B (Vercel). |
| Axe report uploaded as PR artifact, grouped by severity | ✅ Phase A | `actions/upload-artifact` step + axe wrapper groups violations. |
| No secrets in repo; all from CI store | ✅ Phase A | `git grep -E '(SERVICE_ROLE_KEY=|PAYLOAD_SECRET=)'` returns nothing in tracked files; workflow consumes from `secrets.*`. |

## Test plan (TDD where applicable)

- **Unit**: nothing new; Vitest suite from task-03 runs in `unit-test` job.
- **E2E**: smoke spec is the new test. Behavior under TDD:
  1. Write the spec; run locally → fails (no Playwright config).
  2. Add `playwright.config.ts`; run → fails (server not running).
  3. Spec uses `webServer` config to start `bun run dev` → passes.
- **Axe**: assertion lives inside the smoke spec; failure case is forced with a temporary `<button>click</button>` (no a11y label) to confirm the fixture catches it. Revert before commit.

## Out of scope (Phase B — explicit pre-conditions)

| Phase B item | Pre-condition | Owner |
|---|---|---|
| Vercel preview deploys per PR | Operator creates Vercel project; adds `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` to GitHub secrets | Operator |
| Production deploy on tag push to `main` | Same Vercel setup as above | Operator |
| Branch protection (require all gates green) | GitHub repo Settings → Branches → add rule | Operator (UI-only) |
| Lighthouse 95 on seeded profile | task-19 lands `app/[slug]/page.tsx` and seed creates a sample profile | task-19 |

The runbook (`docs/runbooks/ci.md`) walks the operator through each.

## Risks

- **R1 — Bun on GitHub Actions.** `oven-sh/setup-bun@v2` is stable but newer than `setup-node`. *Mitigation:* fall back to `bun install --frozen-lockfile` via npm script if the action ever flakes.
- **R2 — Playwright browser download time.** First-run can be 60s+. *Mitigation:* cache `~/.cache/ms-playwright` with key `${{ runner.os }}-playwright-${{ hashFiles('bun.lock') }}`.
- **R3 — Lighthouse run flakiness.** Different runs swing perf scores by ±5. *Mitigation:* `numberOfRuns: 3` and assert on median; loosen perf to ≥ 80 until task-19 lands.
- **R4 — CI hits hosted Supabase under load.** Free tier rate-limits. *Mitigation:* Phase A only hits Supabase during `next build` (Payload introspection). e2e smoke doesn't traverse data paths.
- **R5 — Operator forgets to add secrets.** First PR after merge will fail loudly with a clear "missing secret X" message. *Mitigation:* runbook + a `verify-secrets.yml` workflow as a one-time manual check.

## Done when

1. `ci.yml` is on `main`; opening a PR runs all five jobs and reports green on a clean PR.
2. A deliberately-broken PR (TS error, lint error, axe violation, build failure) reproduces a red gate within 3 min.
3. `docs/runbooks/ci.md` is committed and walks the operator through Phase B prep.
4. `docs/tasks/task-04-*.md` Status reflects "Phase A complete; Phase B deferred — see runbook."
5. Brain (Maestro) reflects the CI surface so downstream tasks know what gates exist before adding more.
