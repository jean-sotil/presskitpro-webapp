# Task 10 — Implementation Plan (RFC-Lite)

> Architectural artifact for [task-10-editor-section-hero.md](./task-10-editor-section-hero.md).
> Authored under the Maestro protocol. Length: < 300 lines (Anti-Novel Rule).

## Why

Task-10 fills in the first real `EditCard` inside the editor shell (task-09): hero portrait + logo + tagline + CTA + hero-style switcher. It's also the **template** for tasks 11–17 — every following section task slots a similar EditCard into the same chassis. So the patterns we lock here (per-collection PATCH routes, dirty-buffer split, image-compress + upload helpers, EditCard contract) get reused 7 more times.

## Decisions locked (Socratic Gate)

| # | Axis | Decision | Rationale |
|---|---|---|---|
| 1 | EditCard wiring | `components/editor/sections/<Name>EditCard.tsx`. EditorPane switches on `active` key and delegates. Future sections add a case + an import. | One-line addition per future task. No registry-of-React-components gymnastics; types stay clean. |
| 2 | Mutation surface (the precedent for tasks 11–17) | Three independent PATCH routes — `/api/profiles/[id]` (already shipped), `/api/profiles/[id]/content`, `/api/profiles/[id]/theme`. Each lazy-creates the row if missing. EditorClient maintains three dirty buffers; autosave flushes all dirty buffers in parallel. | Profiles, ProfileContent, and Themes are different collections with different access predicates. One-route-per-collection keeps the `ownsViaProfile` predicate simple to reason about. |
| 3 | Image compression | Browser-side: `Canvas` resize so the longest edge is ≤ 2400px, then `canvas.toBlob('image/jpeg', 0.82)`. SVGs (logo only) bypass compression. Original file is replaced with the compressed blob before upload. | PRD note locks the parameters. SVG bypass is necessary — rasterizing a logo destroys it. |
| 4 | Upload helper | `lib/editor/media-upload.ts` — `uploadMedia(file, { bucket, supabaseUserId, alt })` runs the existing 3-step sign → PUT → register chain; returns `{ mediaId, path, bucket }`. Tested with injected `fetch`. | Hero, gallery (task-12), and any future upload reuses this. Centralizes the post-bug-fix `signedUrl` field. |
| 5 | CTA shape | Add to `ProfileContent`: `ctaLabel` (text, localized) + `ctaUrl` (text, NOT localized — same destination across locales). Editor offers 3 presets that prefill `ctaLabel`: "Contato para shows" / "Book now" / Custom. URL is free-form (mailto:, https://, https://wa.me/...). | One simple text field per side. No preset-vs-custom branching at the schema layer; the form decides what to write. |
| 6 | Hero style | Already exists on `Themes.heroStyle` (3 options). Editor renders a 3-radio group; click writes via the new theme PATCH route. Lazy-creates the Themes row on first edit. | No schema change. |
| 7 | Required alt text | Form-level validation: if a portrait Media is set + `alt` is empty, save button is disabled and inline error renders. Server-side, the existing `Media.alt` is `required: true` so a malformed direct API hit is also rejected. | Defense in depth. |
| 8 | Public URL composition | New `lib/media/url.ts` — `mediaUrl({ bucket, path })` → `${NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/<bucket>/<path>`. Used by HeroRender + every future Render. | Public buckets per task-02 spike; no signed URLs needed for render. |
| 9 | HeroRender extension | Renders portrait (full-bleed for `full-bleed-portrait`, side-by-side for `split-portrait-text`, hidden for `centered-logo`), logo (when present), tagline, CTA. Uses `mediaUrl()` for img src. Plain `<img>` for now — `next/image` priority-loaded swap lands in task-19. | Plan note: editor preview is plain `<img>`; public route flips to `next/image`. |
| 10 | Locale tabs | Out of scope (task-29). Hero editor writes to `defaultLocale` only. | PRD §10 Phase 1 = PT-only. |
| 11 | Multiple portraits | Out of scope (v1 = single primary portrait). | Spec scope-out. |

## Cross-references

- PRD §6.3 (Hero), §6.4 step 1 (publish flow), §12.2 (hero style variants).
- task-09 (editor shell — EditorPane, EditorClient, autosave, ProfileRenderer), task-08 (`Profiles.{portrait,logo}` relationships, `ProfileContent.tagline`, `Themes.heroStyle`, `ownsProfile` / `ownsViaProfile` predicates), task-02 (public storage buckets).

## File inventory (deliverables)

### Schema (new fields)
- `payload/collections/ProfileContent.ts` — add `ctaLabel` (text, localized, optional) + `ctaUrl` (text, optional, max 500). `ctaUrl` validate: same loose http-or-mailto-or-tel check the wizard's social step uses.
- `migrations/<ts>_task_10_cta.ts` — generated.
- `payload-types.ts` — regenerated.

### Helpers (TDD)
- `lib/editor/image-compress.ts` (+ test) — `compressImage(file, { maxEdge?: 2400, quality?: 0.82 })`. Returns the original unchanged for SVG. Tests use a fixture image via `Buffer.from(base64png)` → `Blob`; assertions on output mime + bytes-shrunk.
- `lib/editor/media-upload.ts` (+ test) — `uploadMedia(deps, args)` injection-style; tests stub the three fetches.
- `lib/media/url.ts` (+ test) — `mediaUrl({ bucket, path })`. Pure.

### REST routes
- `app/api/profiles/[id]/content/route.ts` — `PATCH`. Whitelisted fields: `tagline`, `ctaLabel`, `ctaUrl`, `bio`, `services`, `metaTitle`, `metaDescription`. Locale param via `?locale=pt-BR|en` (defaults to `pt-BR`). Lazy-creates the ProfileContent row if absent.
- `app/api/profiles/[id]/theme/route.ts` — `PATCH`. Whitelisted fields: `heroStyle`, `galleryLayout`, `fontPairId`, `colorPresetId`, `bg`, `accent`, `text`, `sectionOrder`. Lazy-creates the Themes row.
- Unit tests on each: auth boundary (mock `resolvePayloadUserLive` + Payload), happy path, lazy-create branch, 401 / 403 / 404 surfaces.

### Editor UI
- `components/editor/sections/HeroEditCard.tsx` (+ test) — the form. Fields:
  - portrait dropzone (alt input below; required if file present)
  - logo dropzone (alt input below; optional)
  - tagline (160 char counter)
  - CTA preset dropdown + URL field (CTA label resolves from preset, custom is editable)
  - hero style 3-radio
  - All onChange handlers call back into EditorClient via the new `onMutate(scope, patch)` contract.
- `components/editor/sections/PlaceholderEditCard.tsx` — extracted from EditorPane's current inline placeholder; props `{ key, label, comesIn }`.
- `components/editor/EditorPane.tsx` — refactor: switch on `active`, delegate to `HeroEditCard` or `PlaceholderEditCard`. The shell-level slug + tagline inputs go away.

### EditorClient.tsx refactor
- Replace single `dirtyRef` with three: `dirtyProfile`, `dirtyContent`, `dirtyTheme`.
- New `applyMutation(scope: 'profile' | 'content' | 'theme', patch)` callback passed to EditCard. It (a) mutates the optimistic cache, (b) appends to the right dirty buffer, (c) schedules autosave.
- `triggerSave` flushes all three buffers in parallel via `Promise.all`. SaveStatus reflects the worst state across them.

### Public-facing render
- `components/profile/sections/HeroRender.tsx` — extend to render portrait + logo + CTA, switching on `Themes.heroStyle`.

### E2E
- `tests/e2e/editor-hero.spec.ts` — `@smoke` rung: anonymous /dashboard/profile/X redirects (already covered in task-09 spec, reuse). `@full` (gated on `EDITOR_E2E_COOKIE` + `EDITOR_E2E_PROFILE_ID`): pick hero style → preview reflects → autosave fires.

### Section registry tweak
- `lib/editor/sections.ts` — set `hasEditor: true` on hero. Used by EditorPane to decide HeroEditCard vs Placeholder. Avoids forgetting to remove a placeholder when sections ship.

### Docs
- `docs/runbooks/dev-editor.md` — append: "Test the hero editor: upload a portrait, write alt text, switch hero styles, confirm save status flips on each change."

## Implementation sequence

1. **Schema.** Add ctaLabel + ctaUrl to ProfileContent. `migrate:create` → review → apply. Regenerate types.
2. **Pure helpers (TDD).** image-compress, media-upload, mediaUrl.
3. **REST routes (TDD on auth boundary).** Content + theme PATCH routes.
4. **Section registry tweak + Placeholder extraction.** No behavior change; sets up the EditorPane delegation.
5. **EditorClient triple-buffer refactor.** All existing tests still green.
6. **HeroEditCard (TDD).**
7. **HeroRender extension** (no test beyond visual; touches the existing snapshot test).
8. **EditorPane delegation.** Hero now active; placeholders for the rest.
9. **E2E.**
10. **Verification matrix.**

## Acceptance evidence (Verification Matrix)

| AC | How verified |
|---|---|
| 6MB JPEG compresses to ≤ 2MB before transfer | `image-compress.test.ts` covers the resize path; the sign-upload route's existing 10MB hard ceiling is ALSO checked (we send the compressed file). |
| Save blocked when alt is empty | HeroEditCard.test: portrait file selected + alt empty → save button disabled + inline `role="alert"`. |
| Hero style switch updates preview without re-uploading | optimistic `applyMutation('theme', { heroStyle })` doesn't touch portrait state. Confirm in component test. |
| CTA renders the configured destination on the public page | HeroRender renders the configured `ctaUrl` as an `<a>`; preserved across mailto / https / wa.me. Test: snapshot matches each prefix. |

## Test plan (TDD)

- **Unit:** image-compress (canvas mock), media-upload (fetch mock x3), mediaUrl (pure), content + theme route handlers (Payload mock), HeroEditCard (TL: validation + save-disabled gates).
- **Integration:** none — covered by existing ProfileRenderer tests + new HeroRender extension snapshots.
- **E2E:** smoke + @full hero-style toggle.

## Out of scope (explicit)

- **Locale tabs** — task-29.
- **Multiple portraits** — v1 single primary.
- **`next/image` swap on the public hero** — task-19.
- **Theme tab** (full color/font/layout configurator) — task-18.
- **Image cropping / face-detect zoom** — out of MVP entirely.
- **Persisting `Themes.sectionOrder` server-side** — wired optimistic-only in task-09; the new theme route here adds the persistence as a side benefit.

## Risks

- **R1 — Canvas-based compression on iOS Safari has memory limits.** Large images (> 50MB raw) crash the tab. *Mitigation:* the `/api/storage/sign-upload` route has a 10MB hard ceiling; client-side compression accepts up to 30MB inputs and rejects above that BEFORE drawing to canvas.
- **R2 — Lazy ProfileContent / Themes creation race.** Two concurrent mutations both think the row is missing → double-create. *Mitigation:* DB-level uniqueness on `profile_id` (already present from task-08). The second insert fails with a unique-violation; the route catches that, fetches the now-existing row, and re-applies the patch.
- **R3 — Optimistic update / server-state divergence on heroStyle.** *Mitigation:* same posture as task-09 — onError invalidates the bundle key.
- **R4 — Public bucket permissions changed.** If someone tightens the `avatars` bucket to private, `mediaUrl()` returns a URL that 404s. *Mitigation:* document the public-bucket assumption in the helper's doc comment + a security note in task-27 (RLS hardening).

## Done when

1. Schema migrations applied; types regenerate clean; typecheck green.
2. All 5 new TDD modules + EditCard test green.
3. EditorClient refactor: existing 296 tests still pass + new ones added.
4. Hero editor in `/dashboard/profile/<id>`: upload portrait, set alt, edit tagline + CTA, switch style — all reflect in preview within 200ms; SaveStatus flips correctly.
5. Public render shows the configured hero against `mediaUrl()`-resolved sources.
6. E2E ladder smoke green.
7. Plan file (this doc) committed alongside implementation.
