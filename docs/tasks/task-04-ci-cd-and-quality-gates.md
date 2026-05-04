# Task 04 — CI/CD & Quality Gates

## Summary
Establish the pipeline that enforces every quality bar in the PRD on every PR.

## PRD references
- §11 (a11y), §13 (perf targets), §19 (success metrics: zero critical axe violations), Appendix C (DoD).

## Dependencies
- task-01.

## Scope (in)
- GitHub Actions (or chosen CI) workflows: `typecheck`, `lint`, `unit-test`, `e2e` (Playwright), `axe`, `lighthouse-ci`, `build`.
- Branch protection: require all gates green before merge.
- Lighthouse-CI budget file enforcing Perf/A11y/BP/SEO ≥ 95 on a representative seeded profile route.
- `axe-core` runs on every key route in CI; PR blocked on any **critical** or **serious** violation.
- Preview deployments per PR (Vercel or equivalent) with seeded Supabase + Payload data.
- Production deploy on tag push to `main`.

## Scope (out)
- Production observability (task-28).
- Status page (separate ticket later).

## Acceptance criteria
- [ ] A PR that introduces a TypeScript error fails CI in under 3 minutes.
- [ ] A PR that drops Lighthouse Performance below 95 on the seeded profile fails CI.
- [ ] Playwright runs against an ephemeral preview env with deterministic seed data.
- [ ] Axe report uploads as a PR artifact with violations grouped by severity.
- [ ] No secrets in repo; all envs flow from CI secret store.

## Implementation notes
- Use Playwright's HTML reporter; upload as PR artifact for failed runs.
- Lighthouse-CI: throttle to mobile + 4G profile per §13.
- Snapshot tests on critical visual primitives (sparingly — visual regression is high-maintenance).

## Status

**Phase A complete** — automated gates land on every PR via [.github/workflows/ci.yml](../../.github/workflows/ci.yml). See the [CI runbook](../runbooks/ci.md) for the full pipeline diagram, required secrets, and Phase B walkthrough.

| AC | State | Notes |
|---|---|---|
| TS error fails CI in < 3 min | ✅ | `gates` matrix runs in parallel; typecheck job is sub-2 min. |
| Lighthouse < 95 fails CI on seeded profile | 🚧 deferred to task-19 | Initial budget is perf ≥ 80 on `/`; tightens to ≥ 95 on a seeded profile when task-19 lands the public profile route. Documented in runbook §B4. |
| Playwright runs against ephemeral preview env | 🟡 partial | Phase A: against locally-built `bun run start` with shared hosted Supabase. Per-PR Vercel previews are Phase B (operator-setup, runbook §B2). |
| Axe report uploaded as PR artifact | ✅ | `playwright-report` artifact, 7-day retention. Severity grouping inside `tests/e2e/fixtures/axe.ts`. |
| No secrets in repo | ✅ | All env flows via `secrets.*`. Required secret list in runbook. |

**Phase B deferrals (operator-driven, not code):**
- Vercel project + preview deploys.
- Branch protection (UI-only).
- Tag-push prod deploy.
- Lighthouse ≥ 95 on a seeded profile (depends on task-19).

## Definition of Done
Per Appendix C; Phase A artifacts (workflow, runbook, e2e + axe + LHCI configs) committed alongside the task plan.
