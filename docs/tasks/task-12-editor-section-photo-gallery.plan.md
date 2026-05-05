# Task 12 — Implementation Plan (RFC-Lite)

> Architectural artifact for [task-12-editor-section-photo-gallery.md](./task-12-editor-section-photo-gallery.md).
> Authored under the Maestro protocol. Length: < 300 lines (Anti-Novel Rule).

## Why

The gallery is the most upload-heavy and a11y-sensitive surface in the editor. It introduces three patterns the rest of the app reuses:

1. **Multi-file upload pipeline** with per-file phase progress (gallery, future bulk imports).
2. **Server-side Media mutation** (`PATCH /api/media/[id]`) — first time we update an existing Media doc, not just register a freshly-uploaded one. Same shape will be reused by every future "edit alt text on a portrait we already uploaded" path.
3. **WCAG-compliant decorative-alt opt-out** — `alt=""` is the right answer, but only when the user explicitly says "decorative".

## Decisions locked (Socratic Gate)

| # | Axis | Decision | Rationale |
|---|---|---|---|
| 1 | Profile→Gallery linkage | New `Profiles.gallery` field — Payload `relationship` to media, `hasMany: true`. Order preserved by array index (Payload's natural behavior). | Cleanest schema: one source of truth for "what photos appear on this profile, in what order." Avoids polluting Media with category enums. |
| 2 | Decorative-alt | New `Media.decorative` boolean (default `false`). Loosen `Media.alt` from `required: true` to a custom `validate` that accepts `alt.length > 0` OR `decorative === true`. Public render: emit `alt=""` when decorative. | The exact AC pattern. Decorative photos exist (texture shots, abstract bg); WCAG explicitly says `alt=""`, not "decorative". |
| 3 | Image format strategy | Extend `compressImage()` to attempt AVIF first via `canvas.toBlob('image/avif', 0.7)`; fall back to JPEG @ 0.82 if AVIF returns null (older browsers, MIME mismatch). Long edge stays at 2400px. | AVIF wins ~30% smaller for the same perceptual quality. Browser-native; no extra deps. |
| 4 | Concurrent uploads | Cap at 3 parallel uploads. Each file goes through phases: `queued → compressing → uploading → registering → done` (or `error`). The widget shows a per-file progress row keyed by the phase. | Avoids melting Supabase rate limits or the user's network. Phase-level progress satisfies the "accurate per-file progress" AC without needing XHR-byte-streams. |
| 5 | Soft / hard caps | Soft 24: orange warning banner above the dropzone. Hard 50: dropzone disabled, helper says "Limite atingido (50)". | Per spec. The soft cap is UX guidance; the hard cap is enforced both client-side and server-side via array max-length on `Profiles.gallery`. |
| 6 | Bulk delete | Per-card checkbox + sticky bottom bar `Excluir selecionadas (N)` → confirmation modal (reuses `<PublishDialog>`-style scaffold). Removes the picked Media docs from `Profiles.gallery` and DELETEs them via Payload (Media row + Storage object both go). | Spec AC. Reuses existing dialog primitive. |
| 7 | Reorder persistence | dnd-kit (already wired). Drag-end → optimistic `applyMutation('profile', { gallery: nextArray })` → autosave PATCH. Order is just array order; no extra columns. | Same shape as task-09's section rail and task-11's services. |
| 8 | Alt-text editing on existing photos | New `PATCH /api/media/[id]` — accepts `{ alt?, decorative? }`. Auth via the existing `ownsProfile` check transitively (we verify the user owns at least one profile that contains this Media in its gallery). | Defense-in-depth: someone could try to mutate another user's Media doc directly. The route confirms gallery membership before delegating. |
| 9 | Public render | `<PhotoGalleryRender />` switches on `Themes.galleryLayout` (mosaic / uniform-grid / carousel). Carousel ships as a horizontal-scroll list (no JS) for v1; full carousel UX is task-18 / 19 polish. | Layout switching is a theme concern; we're just reading the value and matching CSS. |
| 10 | Bulk-upload UI | Single "Adicionar fotos" button + drag-drop overlay across the editor pane. Drop multiple files → all go into the queue at once. | Standard photo-grid affordance; no separate "upload area" + "gallery area" split. |
| 11 | Out of scope reaffirmed | Cropping, video, AVIF feature-detect UI, srcset on the public route (task-19 polish). | Spec scope-out. |

## Cross-references

- PRD §6.3 (gallery), §11 (a11y alt-text gate), §12.2 (gallery layout switcher in Theme tab).
- task-08 (Media + Profiles), task-09 (EditorPane delegation, autosave triple-buffer), task-10 (`compressImage`, `uploadMedia`, `mediaUrl`), task-11 (alongside the editor pattern; no shared code beyond the rail).
- task-18 (Theme tab — gallery layout switcher).
- task-19 (public route — `<PhotoGalleryRender />` swap to `next/image` priority).
- task-27 (RLS hardening — ownership predicate on Media).

## File inventory (deliverables)

### Schema
- `payload/collections/Profiles.ts` — add `gallery` (relationship → media, hasMany, max 50 enforced via custom validate).
- `payload/collections/Media.ts` — add `decorative` (boolean, default false). Replace `alt: required: true` with a custom `validate` that accepts non-empty alt OR `decorative === true`.
- `migrations/<ts>_task_12_gallery.ts` — generated.

### Pure helpers (TDD)
- `lib/editor/image-compress.ts` — extend with AVIF-first/JPEG-fallback path + tests for the fallback branch.
- `lib/editor/gallery-validate.ts` (+ test) — `validateGallery({ items: Array<{ alt, decorative }> })` reports first failing index; enforces hard cap of 50.
- `lib/editor/parallel-upload.ts` (+ test) — `runParallel({ items, concurrency, run })`. Pure scheduler; tests cover concurrency cap + error isolation.
- `lib/editor/upload-phase.ts` (+ test) — phase state machine: `queued → compressing → uploading → registering → done/error`.

### REST routes
- `app/api/media/[id]/route.ts` — `PATCH` (alt, decorative) + `DELETE` (remove Media doc + Storage object). Auth: caller must own a profile that lists this media in its `gallery`, OR own this media via the `Media.owner` predicate (existing).
- Unit tests on the auth boundary.

### Editor UI
- `components/editor/sections/PhotoGalleryEditCard.tsx` (+ test) — drop-zone, queue list, sortable grid, multi-select bulk delete, soft-cap banner.
- `components/editor/gallery/GalleryItem.tsx` (+ test) — single sortable card: thumb, alt input, decorative checkbox, select-checkbox, remove ✕.
- `components/editor/gallery/UploadQueue.tsx` (+ test) — list of in-flight uploads with phase indicators.

### Public renderer
- `components/profile/sections/PhotoGalleryRender.tsx` — switches on layout; reuses `mediaUrl()`. Decorative photos render with `alt=""`.

### Section registry tweak + EditorPane
- `lib/editor/sections.ts` — flip `photoGallery.hasEditor = true`.
- `components/editor/EditorPane.tsx` — add `case 'photoGallery'`.

### E2E + runbook
- `tests/e2e/editor-gallery.spec.ts` — `@full` happy path: drop 3 photos → reorder → mark one decorative → bulk delete.
- `docs/runbooks/dev-editor.md` — append the gallery test recipe.

## Implementation sequence

1. **Schema** — Profiles.gallery + Media.decorative + Media.alt validate. `migrate:create` → review → apply.
2. **Pure helpers (TDD)** — extend image-compress, gallery-validate, parallel-upload, upload-phase.
3. **REST routes** — `/api/media/[id]` PATCH + DELETE with auth tests.
4. **GalleryItem + UploadQueue (TDD).**
5. **PhotoGalleryEditCard (TDD).**
6. **Wire into registry + EditorPane.**
7. **PhotoGalleryRender (public).**
8. **E2E + runbook.**
9. **Verification matrix.**

## Acceptance evidence (Verification Matrix)

| AC | How verified |
|---|---|
| Uploading 10 photos shows accurate per-file progress | UploadQueue test asserts each phase advances; integration via `runParallel`'s test that emits all phase callbacks in order. |
| Decorative renders with `alt=""` | PhotoGalleryRender test: a decorative item emits `<img alt="">`, a normal item emits the alt text. |
| Save blocked with a list of images missing alt text | gallery-validate test reports the offending indices; PhotoGalleryEditCard renders the list as `role="alert"`. |
| Reorder persists across browser refresh | Reorder mutates `Profiles.gallery` array via the existing PATCH route; reload re-fetches the bundle. E2E `@full` covers this. |

## Test plan (TDD)

- **Unit:** image-compress AVIF fallback, gallery-validate, parallel-upload, upload-phase, GalleryItem, UploadQueue, PhotoGalleryEditCard, /api/media/[id] route handlers.
- **Integration:** PhotoGalleryRender against fixture bundles (decorative + normal mix).
- **E2E:** `@full` happy path (skip-flag gated).

## Out of scope (explicit)

- Cropping / face-detect zoom — v1 explicit scope-out.
- Video uploads — v1 scope-out.
- AVIF-supported feature detect / per-browser MIME selector UI — silent fallback.
- `srcset` on the public route — task-19 polish.
- Storage transformation API — v2.
- Per-photo metadata (caption, EXIF) — v2.

## Risks

- **R1 — AVIF encoder unavailable in Safari < 16.** *Mitigation:* `compressImage`'s fallback branch returns JPEG. Test covers the fallback. No user-visible warning.
- **R2 — Concurrent uploads race the registration order.** Two files finish "uploading" out of order; `Profiles.gallery` ends up shuffled. *Mitigation:* `runParallel` returns results in submission order (despite finishing out of order). The append-to-gallery mutation uses the input order, not the resolution order.
- **R3 — Bulk delete leaves Storage orphans.** If the Media doc deletes but the Storage object lingers, we leak. *Mitigation:* the `DELETE /api/media/[id]` route deletes the Storage object FIRST; if that fails, abort before deleting the Payload doc. Reverse-order cleanup means orphaned DB rows beat orphaned files.
- **R4 — Hard cap on `Profiles.gallery` enforced only client-side.** *Mitigation:* Payload's array `maxRows` enforces server-side; the editor disables the dropzone above the cap as belt-and-braces.
- **R5 — Decorative=true with alt set leaves stale alt in the DB.** *Mitigation:* the PATCH route, when receiving `decorative: true`, also blanks `alt` server-side. Reverse path (decorative=false) doesn't blank — the user re-types alt.

## Done when

1. Schema migration applied; types regen clean.
2. All pure helpers + REST handlers TDD green.
3. Drop 3 photos via the editor: queue shows phase progress; finished photos enter the grid; reorder via drag persists.
4. Mark one as decorative → preview emits `alt=""` in the public render.
5. Bulk delete 2 of them via multi-select + dialog → both rows + Storage objects gone.
6. Save status flips correctly; refresh preserves the order.
7. `pnpm test` + `pnpm typecheck` green; e2e smoke green.
8. Plan file (this doc) committed alongside implementation.
