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

## Definition of Done
Per Appendix C.
