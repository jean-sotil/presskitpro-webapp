# Task 15 — Implementation Plan (RFC-Lite)

> Architectural artifact for [task-15-editor-section-press-kit-link.md](./task-15-editor-section-press-kit-link.md).
> Authored under the Maestro protocol. Length: < 300 lines.

## Why

The press-kit link is the most "external" data point on a profile — it points at a third-party host the artist controls. Two patterns get exercised here that downstream tasks reuse:

1. **Server-side reachability check** (`HEAD` with timeout + provider-specific quirks). Same shape will be reused by task-30's daily cron and any future "we link to something offsite, is it still alive?" check.
2. **Validation-gated save** in the editor — unlike previous sections where every keystroke flows through the autosave, the press-kit URL must pass an explicit validation step before it reaches the dirty buffer. The editor stays responsive; bad URLs don't persist.

## Decisions locked

| #   | Axis                           | Decision                                                                                                                                                                                                                                                                                                                | Rationale                                                                                                                                                                                                                          |
| --- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Where validation runs          | New `POST /api/press-kit-validate { url }` route. The editor calls it on blur / "Validar" click, only commits to the bundle on success. The profile PATCH route does NOT re-run HEAD on every save (would block autosave and double the cost on every keystroke after the URL is set).                                  | Spec AC ("Save with a 404 URL shows inline error and does not persist") is satisfied by the editor refusing to call `onMutate` when the URL isn't valid. The cron in task-30 catches link rot; we don't need belt-and-braces here. |
| 2   | HEAD strategy                  | 8s timeout via `AbortSignal.timeout(8000)`. Up to 5 redirects (browsers' standard cap; `fetch` defaults to follow). Fall back to `Range: bytes=0-0` if HEAD returns 405 (Method Not Allowed).                                                                                                                           | Spec note.                                                                                                                                                                                                                         |
| 3   | Restrictive-200 (Google Drive) | When provider is `google-drive` AND the response is 200, do a heuristic: read `<title>` from the body if `Content-Type: text/html`. Drive's "request access" page has `<title>Access denied</title>`. If matched, return `{ ok: true, warning: 'restrictive-access' }` so the editor can flag it without blocking save. | Per spec implementation note.                                                                                                                                                                                                      |
| 4   | Provider list                  | Extend `derivePressKitProvider` (and the `pressKitProvider` enum on Profiles) with `notion` and `mediafire`. Keep `google-drive`, `dropbox`, `onedrive`, `wetransfer`, `other`, `unknown`.                                                                                                                              | Spec lists `notion` + `mediafire` as recognized hosts.                                                                                                                                                                             |
| 5   | Analytics                      | Add `'press_kit_click'` to the `AnalyticsEvent` union. Public CTA fires `track('press_kit_click', { provider, profileSlug })` on click.                                                                                                                                                                                 | Spec AC. The shim already exists; this is one-line per side.                                                                                                                                                                       |
| 6   | Public render polish           | Provider badge ("Hospedado no Google Drive" / "no Dropbox" / etc.) renders next to the CTA when provider is recognized; falls back to no badge when `unknown`/`other`. CTA stays `target="_blank" rel="noopener noreferrer"`.                                                                                           | Spec AC.                                                                                                                                                                                                                           |
| 7   | Editor UI                      | Single URL input + status badge: idle → validating (spinner) → valid (✓ + provider chip) / warning (⚠ "Pode estar restrito a usuários da organização") / invalid (✕ + reason). On valid commit, `applyMutation('profile', { pressKitUrl })`. On warning, allow save with a confirmation. On invalid, no save.           | Spec AC, plus the implementation note about restrictive-200.                                                                                                                                                                       |
| 8   | Out of scope                   | Daily health-check (task-30); ZIP generation; hosting assets.                                                                                                                                                                                                                                                           | Spec scope-out.                                                                                                                                                                                                                    |

## Cross-references

- PRD §6.5 (press kit), §7 (Profiles fields), §18 row #8 (provider badge).
- task-08 (schema), task-09 (autosave + scope dispatch), task-13 (URL canonicalization pattern), task-24 (analytics sink wiring), task-30 (cron health check).

## File inventory

### Schema

- `payload/collections/Profiles.ts` — append `notion` + `mediafire` options to `pressKitProvider` select. Migration generated by `pnpm payload migrate:create`.

### Pure helpers (TDD)

- `lib/payload/hooks/derive-press-kit-provider.ts` (+ existing test) — extend with `notion`, `mediafire` cases; tests already parameterized.
- `lib/server/press-kit-validate.ts` (+ test) — `validatePressKitUrl({ url, fetch?, abortSignal? })`. Pure DI. Returns `{ ok, provider, warning?, status?, finalUrl? }`. Handles HEAD timeout, 405 fallback to ranged GET, Drive's restrictive-200 heuristic.

### REST route

- `app/api/press-kit-validate/route.ts` — POST `{ url }` → `{ ok, provider, warning?, status?, finalUrl? }`. Auth: any logged-in user (no profile-id; the validator has no side effects on data).

### Editor

- `components/editor/sections/PressKitEditCard.tsx` (+ test) — URL input, "Validar" button (or auto-on-blur), status badge, helper hint about public-viewable link.

### Public renderer

- `components/profile/sections/PressKitLinkRender.tsx` — provider badge + `track('press_kit_click', ...)` on click. Needs to become a client component (or extract a small client `<TrackedAnchor>` to keep the section server-rendered).

### Analytics shim

- `lib/analytics/track.ts` — extend the union with `'press_kit_click'`.

### Wire-up

- `lib/editor/sections.ts` — flip `pressKitLink.hasEditor = true`.
- `components/editor/EditorPane.tsx` — add `case 'pressKitLink'`.

### E2E + runbook

- `tests/e2e/editor-press-kit.spec.ts` — `@full` happy path: paste a valid URL → green badge → save persists → bad URL blocks save.
- `docs/runbooks/dev-editor.md` — append the press-kit recipe (incl. the Drive restrictive-200 quirk).

## Implementation sequence

1. **Pure helpers (TDD)** — derive-press-kit-provider extension, press-kit-validate.
2. **Schema + migration** — extend the enum.
3. **REST route** — POST /api/press-kit-validate.
4. **Analytics union** — add `'press_kit_click'`.
5. **PressKitEditCard (TDD)** — input + status badge + validate-on-blur.
6. **Wire registry + EditorPane.**
7. **PressKitLinkRender polish + click tracking + tests.**
8. **E2E + runbook.**

## Acceptance evidence

| AC                                                           | How verified                                                                                                                                                     |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 404 URL shows inline error + does not persist                | EditCard test mocks `fetch('/api/press-kit-validate')` → `{ ok: false, status: 404 }`; asserts `applyMutation` is NOT called and the row's `aria-invalid` flips. |
| HEAD is server-side only                                     | Validation route lives in `app/api/press-kit-validate/route.ts`, never invoked from a client.                                                                    |
| Recognized providers render the correct badge                | PressKitLinkRender test maps each provider value to its expected badge label.                                                                                    |
| Public CTA opens in new tab with `rel="noopener noreferrer"` | Existing render preserves these attrs; tested.                                                                                                                   |
| `press_kit_click` event fires                                | TrackedAnchor test asserts `track('press_kit_click', { provider, profileSlug })` is invoked on click.                                                            |

## Test plan

- **Unit:** `derivePressKitProvider` (+notion +mediafire), `validatePressKitUrl` (timeout, 404, 405-fallback, drive-restrictive-200), `PressKitEditCard` (badge state machine, save gate), `PressKitLinkRender` (badge per provider + click event).
- **Integration:** route handler against a stub fetch.
- **E2E:** `@full` happy path (skip-flag gated).

## Out of scope

- Daily health-check cron — task-30.
- ZIP generation from gallery — explicit scope-out.
- Hosting/proxying press-kit assets ourselves — explicit scope-out per PRD §6.5.

## Risks

- **R1 — HEAD blocked on the host.** Some providers (Notion, Mediafire) may not support HEAD or may return 405. _Mitigation:_ fall back to ranged GET; if both fail, return `{ ok: false, reason: 'unreachable', status }`.
- **R2 — Drive restrictive-200 false positive.** Our heuristic reads `<title>` after fetching ~1KB of the body. If Drive A/B-tests a different title, we mis-flag a public file as restricted. _Mitigation:_ the warning is non-blocking ("Pode estar restrito"); the user can save anyway.
- **R3 — User pastes an authenticated SaaS URL** (e.g. a Notion page set to "view-only with workspace login"). HEAD returns 200. We can't distinguish from the outside. _Mitigation:_ helper text on the editor card: "Verifique se o link está público (não 'restrito ao seu workspace')."
- **R4 — Cron in task-30 races with the editor save.** Both write `pressKitHealthStatus`. _Mitigation:_ the cron is the only writer of `pressKitHealthStatus` per task-08's spec; our save NEVER touches it.

## Done when

1. Pure helpers TDD green; new providers recognized.
2. Validate route returns the right shape for happy/404/timeout cases.
3. EditCard refuses to call `onMutate` on invalid URLs; allows save on warning.
4. Public render shows the provider badge + emits `press_kit_click` on click.
5. `pnpm test` + `pnpm typecheck` green; e2e `@full` green.
6. Plan file (this doc) committed alongside implementation.
