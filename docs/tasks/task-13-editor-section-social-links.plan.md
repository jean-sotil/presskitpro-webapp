# Task 13 — Implementation Plan (RFC-Lite)

> Architectural artifact for [task-13-editor-section-social-links.md](./task-13-editor-section-social-links.md).
> Authored under the Maestro protocol. Length: < 300 lines (Anti-Novel Rule).

## Why

Social links are the editor's first **collection-backed** section: each link is a row in `social-links`, not a JSON field on `profiles` or `profile-content`. Two patterns get introduced here that downstream tasks reuse:

1. **Scope = collection**: the autosave already handles `profile`, `content`, `theme` scopes. Adding `socialLinks` proves the dirty-buffer model extends to one-row-per-item collections.
2. **Reconciling-replace endpoint** (`PUT /api/profiles/[id]/social-links`): one round-trip handles add/remove/reorder/edit. Diffs by row id; preserves IDs across saves so optimistic updates don't churn.
3. **Server-rebuilt URLs** (defense-in-depth): the route never trusts the user-entered href. It parses `@handle` / pasted URLs through a per-platform normalizer, rebuilds the canonical form, and stores only that. Closes the open-redirect/XSS hole called out in the spec implementation note.

## Decisions locked (Socratic Gate)

| # | Axis | Decision | Rationale |
|---|---|---|---|
| 1 | Storage shape | Keep `social-links` as a separate collection (one row per link). Drop `displayOrder` on writes — it's an output of array index, set by the route. | Matches the existing schema. Array index is the source of truth for order, which avoids "two rows have displayOrder=3" drift. |
| 2 | Save mode | Single bulk endpoint: `PUT /api/profiles/[id]/social-links` with `{ links: [{ id?, platform, url }] }`. Server reconciles (update existing, create missing, delete absent). | Fits the autosave's debounced-buffer model (one PATCH per dirty cycle). Per-row CRUD would force a parallel state machine that fights the existing scopes. Last-write-wins on concurrent tabs is acceptable for a single-user editor. |
| 3 | URL handling | Per-platform `parseAndCanonicalize(platform, raw)` returns `{ ok, canonical }` or an error. Rules: pasted `@handle` → canonical URL; bare URLs are parsed and rebuilt from origin + sanitized path; WhatsApp accepts E.164 numbers and produces `https://wa.me/<digits>`; email accepts `user@host` and produces `mailto:user@host`. | Spec AC. Rebuilding from parts (rather than passing the user string through) closes the open-redirect/XSS surface. |
| 4 | Validation surfacing | Inline error per row + a "Como encontrar a URL do {platform}" helper link to a static docs page. Save proceeds for valid rows; invalid rows block the save with a `role="alert"` summary at the top. | Spec AC ("invalid URLs surface inline"). Don't autosave broken rows — server rejection would just produce an error toast with no recovery path. |
| 5 | Cap | 10 rows. "Adicionar link" disables at 10. Server enforces too. | Spec AC. |
| 6 | Reorder | dnd-kit, vertical list (same as services). Drag-end → optimistic `applyMutation('socialLinks', { links: next })` → autosave PUT. | Same shape as task-11. |
| 7 | MutationScope | Add `'socialLinks'` to the union in `EditorClient.tsx`. Add a fourth dirty buffer + a fourth route entry. Cache update path: `qc.setQueryData` writes the new list to `bundle.socialLinks` directly (not nested in `profile`). | The scope already abstracts buffer + route lookup; one new entry per scope. |
| 8 | Public render | `SocialLinksRender` sorts by `displayOrder`, then renders `mailto:` for email, `https://wa.me/<digits>` for WhatsApp, `target="_blank" rel="noopener noreferrer"` for everything else. Label is the platform's PT-BR label (icon set is task-19 polish). | Spec AC. |
| 9 | Out of scope reaffirmed | Icon set, OAuth-connected handles (Instagram Graph in task-34). | Spec scope-out. |

## Cross-references

- PRD §6.3 (social links), §6.4 (icons in hero — text labels until task-19 polish).
- task-08 (`SocialLinks` schema), task-09 (autosave + scope dispatch), task-11 (services drag-reorder pattern), task-12 (collection-side editor pattern, route auth helpers).
- task-19 (public route polish — icon set, srcset).
- task-27 (RLS hardening — already covered by `ownsViaProfile` predicate).

## File inventory (deliverables)

### Pure helpers (TDD)
- `lib/editor/social-link-validate.ts` (+ test) — `Platform` enum, `parseAndCanonicalize(platform, raw)`, `validateLinks(items)` (per-row + dup-platform-check + cap).

### REST route
- `app/api/profiles/[id]/social-links/route.ts` — `PUT` accepts `{ links: [...] }`, calls reconciler, returns the fresh list. Auth: `assertOwnsProfile` first (same as content/theme).
- `lib/editor/social-links-reconcile.ts` (+ test) — pure DI helper: takes `{ existing, incoming, deps }` and emits the create/update/delete plan + final array. Live wiring lives next to it.

### Editor scope wiring
- `app/dashboard/profile/[id]/EditorClient.tsx` — extend `MutationScope`, add `dirtySocialLinks` ref, add `'socialLinks'` to `ROUTE_FOR`, extend `applyMutation` to update `bundle.socialLinks` (sibling, not nested).

### Editor UI
- `components/editor/sections/SocialLinksEditCard.tsx` (+ test) — vertical sortable list, platform `<select>`, URL `<input>`, per-row validation, "Adicionar link" capped at 10, helper link.

### Public renderer
- `components/profile/sections/SocialLinksRender.tsx` — sort by `displayOrder`; emit `mailto:` / `wa.me` for email/whatsapp; PT-BR label; existing test coverage retained.

### Section registry tweak + EditorPane
- `lib/editor/sections.ts` — flip `socialLinks.hasEditor = true`.
- `components/editor/EditorPane.tsx` — add `case 'socialLinks'`.

### E2E + runbook
- `tests/e2e/editor-social-links.spec.ts` — `@full` happy path: add 3 links → reorder → invalid URL inline → fix → remove one.
- `docs/runbooks/dev-editor.md` — append the social-links recipe.

## Implementation sequence

1. **Pure helpers (TDD)** — `social-link-validate`, `social-links-reconcile`.
2. **MutationScope extension** — add `socialLinks` scope, dirty buffer, route entry; bundle cache updater handles top-level array.
3. **REST route** — PUT with `assertOwnsProfile`, route handler test for the auth boundary + reconcile happy path.
4. **SocialLinksEditCard (TDD).**
5. **Wire registry + EditorPane.**
6. **`SocialLinksRender` polish** (mailto / wa.me / order).
7. **E2E + runbook.**
8. **Verification matrix.**

## Acceptance evidence (Verification Matrix)

| AC | How verified |
|---|---|
| Pasting `@handle` is auto-normalized | `parseAndCanonicalize('instagram', '@dj_x')` test → `https://www.instagram.com/dj_x`. |
| Invalid URLs surface inline | EditCard test asserts the row's `aria-invalid` + helper link appears. |
| Reorder persists | Drag-end mutates the array → PUT writes new `displayOrder`. E2E covers refresh. |
| WhatsApp validation enforces E.164 | `parseAndCanonicalize('whatsapp', '5511999999999')` ok; `'invalid'` returns error. |

## Test plan (TDD)

- **Unit:** `social-link-validate` (per-platform parse table), `social-links-reconcile` (create/update/delete plan), `SocialLinksEditCard` (validation, reorder, cap), route handler (auth + reconcile).
- **Integration:** `SocialLinksRender` against fixture bundles (mixed platforms incl. email + whatsapp).
- **E2E:** `@full` happy path (skip-flag gated, same as gallery).

## Out of scope (explicit)

- Per-row optimistic creation/deletion endpoints (bulk-replace is enough).
- Icon set — text labels for v1, task-19 polish.
- OAuth-connected handles (Instagram Graph) — task-34.
- Conflict resolution across tabs — last-write-wins is acceptable.

## Risks

- **R1 — Server rebuild rejects a previously valid URL.** A user pastes `https://www.instagram.com/dj_x?utm=foo`; the canonical strips the query. Their pasted string is preserved client-side optimistically, then server returns the stripped version on refetch — flicker. *Mitigation:* the editor calls `parseAndCanonicalize` client-side too on every change; the input always shows the canonical version. The flicker doesn't happen.
- **R2 — Reconcile partial failure.** Update of row 3 succeeds, delete of row 5 fails (Payload throws). Database left in an in-between state. *Mitigation:* the route returns 500; the autosave error path invalidates the query, refetches, and the editor re-renders with whatever the database currently holds. User retries.
- **R3 — Concurrent tabs save in different order.** Tab A reorders, Tab B adds a row, Tab A's PUT lands second. Tab A's snapshot doesn't have Tab B's new row → it's deleted. *Mitigation:* documented as out of scope; matches the gallery + sectionOrder posture.
- **R4 — Phishing via WhatsApp.** A normalized `wa.me/<digits>` link could go to anyone. *Mitigation:* same posture as every other social link — the user types the number; we don't introspect the destination.

## Done when

1. Pure helpers TDD green.
2. Route handler test green (auth + reconcile happy path).
3. EditCard test green; manual smoke: add 3 links → reorder → bad URL flagged → fix → save persists → reload preserves order.
4. Public render emits `mailto:` / `wa.me` correctly.
5. Save status flips correctly during autosave.
6. `pnpm test` + `pnpm typecheck` green; e2e smoke green.
7. Plan file (this doc) committed alongside implementation.
