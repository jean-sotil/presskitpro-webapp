# Task 09 — Implementation Plan (RFC-Lite)

> Architectural artifact for [task-09-profile-editor-shell.md](./task-09-profile-editor-shell.md).
> Authored under the Maestro protocol. Length: < 300 lines (Anti-Novel Rule).

## Why

Task-09 is the dashboard's spine. Every section task (10–17), the Theme tab (18), and the public profile (19) hang off it: they implement the *contents* of the panes this task carves out. The shell decides the load-bearing architecture — how edits flow into autosave, how the live preview stays in sync, how publish triggers ISR — and gets it working with section *placeholders* so future tasks can fill them in without touching the chassis.

## Decisions locked (Socratic Gate)

| # | Axis | Decision | Rationale |
|---|---|---|---|
| 1 | Draft semantics | The Profile row IS the draft. Edits autosave directly to `profiles.*` + `profile_content.*` etc. `Profiles.status` (draft / published / unpublished) gates public visibility; **Publish** flips `status='published'` and triggers `revalidatePath('/${slug}')` (already wired in task-08's afterChange). | Avoids enabling Payload's heavier `versions: { drafts: true }` feature. ISR makes the cache window short enough that the "live edits to a published profile" UX is acceptable for MVP. PRD §6.4 doesn't require Payload-level versioning, only a Publish gate. |
| 2 | Save mechanism | REST `PATCH /api/profiles/[id]` (and child mutations). Driven by TanStack Query mutations with `setQueryData` for optimistic preview updates and rollback on error. | The plan note explicitly calls for TanStack `setQueryData` — server actions don't compose with that pattern. REST keeps the mutation contract testable. |
| 3 | Editor data shape | Single GET `/api/profiles/[id]/editor-bundle` returns `{ profile, content, theme, socialLinks, featuredTrack, instagramConnection }` in one round-trip. Cached as a single TanStack Query key `['editor', id]`. | Eliminates 6 round-trips on first paint. Optimistic mutations update the bundle in place. |
| 4 | Live preview | New `<ProfileRenderer mode="preview" \| "public" data={bundle} />` component used by both the editor preview pane (this task) AND the public route (task-19). It server-renders against draft data when `mode="preview"`. | Plan note: "same RSC tree as public page". Building it now means task-19 is essentially a thin route wrapper + SEO. Each section inside `<ProfileRenderer>` is a placeholder this task; tasks 10–17 swap in the real internals. |
| 5 | Section registry | Static map at `lib/editor/sections.ts`: `[{ key, label, EditCard, RenderCard }]` for all 9 reorderable sections (hero, about, services, featuredTrack, instagramFeed, photoGallery, pressKitLink, socialLinks, contact). `EditCard` and `RenderCard` are placeholders shipped here; future tasks replace them. | A single source of truth for the section list keeps the rail, the editor pane, the preview pane, and `Themes.sectionOrder` consistent. |
| 6 | Drag-reorder | `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities`. Hero stays draggable per PRD ("all sections individually reorderable") — power to the user; we don't second-guess. Order persisted to `Themes.sectionOrder`. | dnd-kit is the accessible standard; arrow-key reorder for keyboard a11y. Three packages, ~30KB gz total. |
| 7 | Autosave debounce | 5s of input inactivity → mutation fires. `visibilitychange` event flushes the pending mutation immediately when the tab is hidden (PRD AC). `beforeunload` is intentionally NOT used (modern browsers block async work there). | Matches the AC literally. Single shared debouncer at the editor-pane level coordinates all section mutations. |
| 8 | Save status indicator | Three states: `idle` ("Salvo"), `pending` ("Salvando..."), `error` ("Erro — clique para tentar de novo"). When `idle`, the indicator shows relative time ("Salvo · há 12s") refreshed via a 30s `setInterval`. | Visible reassurance without spam. Errors don't bury — clickable retry. |
| 9 | Publish modal | Custom `<Dialog>` built from scratch (project has no Radix / Headless UI). Focus-trapped, `<dialog>` element with backdrop. Confirm action calls `POST /api/profiles/[id]/publish` (server-side: sets status, fires revalidate). | Adds 1 component, no extra deps. Reuses existing focus-visible / a11y conventions. |
| 10 | Mobile fallback | <1024px: editor + preview become two tabs (`Editar` / `Visualizar`) controlled by URL hash (`#edit` / `#preview`). Tab nav is keyboard-driven (arrow keys + Home/End). | Hash sync means deep-linking to mobile preview is shareable. Keyboard nav covers the AC. |
| 11 | "Last edited" copy | Stored as `profiles.updated_at` (Payload owns this already). Displayed as relative time using `Intl.RelativeTimeFormat` (no extra dep). | No schema change. |
| 12 | Section internals — out of scope | Each `EditCard` is a placeholder: "Edit this section in task-NN" with a disabled-state stub form. `RenderCard` shows whatever data exists in the bundle, formatted minimally. | Lets the chassis ship + tested without unblocking 8 downstream tasks first. |

## Cross-references

- PRD §6.3 (editor spec), §6.4 (publish/draft), §2 goal #1 (TTPP).
- Plan note: "Preview pane uses the same RSC tree as the public page, behind a draft flag — guarantees parity."
- ADR-0001 (Payload owns content; `revalidatePath` is the cache hook).
- task-06 (wizard creates the Profile this editor edits), task-08 (collections + ownership predicates + ISR hook + slug operations), task-19 (public route — depends on `<ProfileRenderer>`).

## File inventory (deliverables)

### Renderer (shared with task-19)
- `components/profile/ProfileRenderer.tsx` — composes the section components in `Themes.sectionOrder` order. RSC; takes `data` + `mode`.
- `components/profile/sections/<key>/Render.tsx` × 9 — placeholders that show whatever data exists. No TDD beyond "renders without crashing".
- `components/profile/ProfileRenderer.test.tsx` — TL: renders with empty data, with full bundle, respects sectionOrder.

### Editor shell
- `app/dashboard/profile/[id]/page.tsx` — server component: auth gate + ownership check + GET bundle + initial render.
- `app/dashboard/profile/[id]/EditorClient.tsx` — client island: TanStack Query subscription, autosave debouncer, drag-drop wiring, publish modal trigger.
- `app/dashboard/profile/[id]/loading.tsx` — skeleton for the two-pane layout.
- `app/dashboard/profile/[id]/not-found.tsx` — for invalid id / no-permission.

### Editor primitives (TDD where logic exists)
- `components/editor/SectionRail.tsx` — drag-reorder list (dnd-kit). Tests: keyboard reorder, ARIA roles, callback contract.
- `components/editor/EditorPane.tsx` — left pane; renders the active section's `EditCard` based on `?section=<key>`.
- `components/editor/PreviewPane.tsx` — right pane; renders `<ProfileRenderer mode="preview" />` against the optimistically-updated bundle.
- `components/editor/SaveStatus.tsx` — 3-state badge + relative-time updater. Test: `idle → pending → idle`, error retry, time tick.
- `components/editor/PublishDialog.tsx` — modal w/ focus trap. Tests: open/close on Escape, restore-focus on close, axe-clean.
- `components/editor/MobileTabs.tsx` — hash-synced tab pair. Tests: hash sync, keyboard nav, ARIA `tabpanel` wiring.

### Section registry + helpers
- `lib/editor/sections.ts` — `SECTIONS`: static array of `{ key, label, EditCard, RenderCard, defaultPosition }`.
- `lib/editor/section-order.ts` (+ test) — `mergeOrder(persisted, registryDefaults)` returns a complete order even if `Themes.sectionOrder` is partial. `reorderSection(order, fromKey, toKey)` for dnd-kit's drop callback. Pure.

### Mutation logic (DI for test, like task-06)
- `lib/editor/autosave.ts` — pure debouncer: `createAutosave({ debounceMs, flush })`. Tests: 5s debounce, immediate-flush on call, idempotent on consecutive flushes.
- `lib/editor/relative-time.ts` (+ test) — `formatRelative(from, now)` → "agora", "há 12s", "há 4 min", etc. Wraps `Intl.RelativeTimeFormat`.

### API routes
- `app/api/profiles/[id]/route.ts` — `GET` + `PATCH`. Auth via Supabase server client → look up Payload User → use Payload Local API with `user: payloadUser` so the `ownsProfile` predicate gates writes. PATCH accepts a partial profile + optional nested writes.
- `app/api/profiles/[id]/editor-bundle/route.ts` — `GET`: composes the 6-collection bundle in one query (depth=2 for nested relations). Auth-gated.
- `app/api/profiles/[id]/publish/route.ts` — `POST`: sets `status='published'`, lets the existing afterChange hook fire `revalidatePath`. Returns the updated profile + the public URL for client-side redirect.
- `app/api/profiles/[id]/unpublish/route.ts` — `POST`: sets `status='unpublished'`.

### Schema (none) + types (regenerate)
- No schema changes — `Themes.sectionOrder` already exists from task-08.
- `payload-types.ts` regenerate is a no-op but committed alongside the rest.

### Auth helper
- `lib/auth/payload-user-from-request.ts` (+ test) — `getPayloadUserFromRequest()` thin wrapper used by every editor REST route. Reuses the strategy + verifySession boundaries from task-08.

### Dashboard wiring
- `app/dashboard/page.tsx` — replace the stub with: list user's profiles + "Open editor" button per profile + "Continuar onboarding" if incomplete (already wired). Quiet — task-09 isn't a dashboard-redesign task.

### E2E
- `tests/e2e/editor.spec.ts` — `@smoke`: anonymous redirects + 404 for foreign profile id. `@full` (gated on `EDITOR_E2E_COOKIE`): edit tagline → autosave fires → preview updates → publish → public URL renders.

### Docs
- `docs/runbooks/dev-editor.md` — short runbook: how to open the editor against the seeded demo profile (`/dashboard/profile/<id>`), how to mock autosave failures for QA.

## Implementation sequence

1. **Add deps.** `bun add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`.
2. **Pure helpers (TDD).** `section-order.ts`, `autosave.ts`, `relative-time.ts`.
3. **Auth helper (TDD).** `getPayloadUserFromRequest()` against the strategy from task-08.
4. **API routes.** GET bundle, PATCH profile, POST publish/unpublish. Each with a unit test on the auth boundary (no DB needed — mock Payload).
5. **Renderer + section placeholders.** `<ProfileRenderer>` + 9 placeholder Render components. TL test for the renderer.
6. **Editor primitives.** SaveStatus, PublishDialog, SectionRail, EditorPane, PreviewPane, MobileTabs — TDD each.
7. **Section registry.** `lib/editor/sections.ts` — wires every key to its EditCard + RenderCard placeholder.
8. **Editor route.** `page.tsx` (server) + `EditorClient.tsx` (client island) — bring it all together.
9. **Dashboard.** Replace the stub with the profile list.
10. **E2E ladder.**
11. **Verification matrix.**

## Acceptance evidence (Verification Matrix)

| AC (from task) | How verified |
|---|---|
| Edits reflect in preview within 200ms | `setQueryData` is synchronous; the preview component is a controlled view of the bundle. RTL test asserts the preview re-renders within a tick of an edit. |
| Closing tab mid-edit doesn't lose data | `visibilitychange` listener in `EditorClient` flushes any pending autosave mutation. RTL test fires the event with a dirty bundle and asserts the mutation is called. |
| Publish makes profile reachable in 5s | `revalidatePath('/${slug}')` already fires from the Profiles afterChange hook (task-08). E2E `@full` walks publish → fetch `/${slug}` → expect 200 within 5s. |
| Drag-reorder updates without full reload | `setQueryData` updates `Themes.sectionOrder` optimistically; the preview reads the order from the same key. No router push. |
| Mobile tab fallback keyboard-navigable | RTL test on `MobileTabs` covers tab/arrow/Home/End. axe scan passes. |

## Test plan (TDD)

- **Unit:** all pure helpers (`section-order`, `autosave`, `relative-time`), all editor primitives (SaveStatus, PublishDialog, SectionRail, MobileTabs), all REST route handlers (mocked Payload).
- **Integration:** `<ProfileRenderer>` against the seeded bundle shape.
- **E2E:** smoke (auth + ownership), full (edit → autosave → publish → public render).

## Out of scope (explicit)

- Section internals (tasks 10–17). Each `EditCard` is a "this lands in task-NN" placeholder with an aria-label so the rail's sortable test still asserts a known label.
- Theme tab (task-18).
- SEO/metadata of the public route (task-20). `<ProfileRenderer>` exists; `app/(public)/[slug]/page.tsx` is task-19.
- Versioned drafts (Payload `versions: { drafts: true }`) — see decision #1.
- Permission-restricted "viewer" role on the editor — out of MVP.

## Risks

- **R1 — Optimistic update / server-state divergence.** If the PATCH fails after an optimistic update, the rollback might leave the user staring at stale data. *Mitigation:* TanStack mutation `onError` invalidates the bundle key (refetch) AND surfaces the error in `SaveStatus` with retry.
- **R2 — Section placeholders look broken in the preview.** *Mitigation:* placeholders explicitly render "Editor de [section] chega na task-NN" copy in dev; in prod, hidden until the section's real implementation lands. A `process.env.NODE_ENV === 'production'` check gates the placeholder visibility, so demo seed profiles render cleanly even before tasks 10–17.
- **R3 — `Themes.sectionOrder` partial.** A profile created via the wizard (task-06) doesn't have a Themes row yet. *Mitigation:* the editor lazily-creates the Themes row on first save; until then, `mergeOrder()` falls back to the registry defaults.
- **R4 — `revalidatePath` outside Next runtime** (we hit this in task-08 seed). The publish route runs inside Next so it's fine; just keep the swallow in `profile-revalidate.ts` so future scripts don't crash.
- **R5 — Drag-drop on mobile.** dnd-kit needs touch sensors enabled for the rail to work on iOS Safari. *Mitigation:* `useSensors(TouchSensor, PointerSensor)` + a 200ms long-press delay so taps don't accidentally start drags.

## Done when

1. `/dashboard/profile/[id]` loads against a seeded profile; two-pane layout renders; all 9 section placeholders show in the preview.
2. Edit (any section's name/copy) → preview updates in < 200ms → after 5s the autosave fires → SaveStatus reads "Salvo · há Xs".
3. Tab close (simulate via `visibilitychange`) flushes the pending save.
4. Drag-reorder a section → preview updates immediately → server is updated.
5. Publish modal opens, Confirm flips status, public URL renders the profile within the cache window.
6. Mobile (<1024px) collapses to tabs; keyboard navigation covers everything.
7. `pnpm test` + `pnpm typecheck` green; e2e smoke green.
8. Plan file (this doc) committed alongside implementation.
