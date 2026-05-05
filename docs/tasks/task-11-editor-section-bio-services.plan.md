# Task 11 — Implementation Plan (RFC-Lite)

> Architectural artifact for [task-11-editor-section-bio-services.md](./task-11-editor-section-bio-services.md).
> Authored under the Maestro protocol. Length: < 300 lines (Anti-Novel Rule).

## Why

Bio + Services are the two text-heavy sections of the public profile. They carry the artist's narrative (PRD §3 personas: emerging DJs need *prompting*; established artists need *clean prose round-trip from press releases*). The editing UX gates whether the product feels professional or DIY — paste from Word, see clean text; drag a service card, see it move.

Both sections share `ProfileContent`, so they share the same PATCH route from task-10. The work is entirely UI + Lexical wiring.

## Decisions locked (Socratic Gate)

| # | Axis | Decision | Rationale |
|---|---|---|---|
| 1 | Editing engine | **Lexical** (already chosen via `@payloadcms/richtext-lexical`). Add explicit deps: `lexical`, `@lexical/react`, `@lexical/rich-text`, `@lexical/list`, `@lexical/link`, `@lexical/utils`, `@lexical/html`. | Round-trips byte-for-byte with what Payload stores in `ProfileContent.bio`. Payload's admin and our editor read/write the same JSON. |
| 2 | Rendering on the public profile | **Custom JSON walker** (`lib/editor/rich-text/render.tsx`), not Lexical-on-server. Walks the Lexical state JSON → React nodes. | Keeps Lexical out of the public route's bundle (~80kb saved per task-19's Lighthouse target). Lexical state JSON is stable + well-documented. |
| 3 | Two EditCards or one | **Two**: `AboutEditCard` and `ServicesEditCard`. Each flips `hasEditor: true` in the registry. | The rail has them as separate keys (PRD §6.3). One task ships both, but they're independently selectable. |
| 4 | Toolbar allowlist | Heading (h2 / h3), Bold, Italic, ordered + unordered lists, link. Nothing else. Locked by the `nodes` array passed to `LexicalComposer`. | PRD §6.3 spec. Heading h1 is reserved for the public hero; allowing it in the bio breaks the page outline. |
| 5 | Paste sanitization | Pass pasted HTML through `sanitizePastedHtml(html)` before handing to Lexical's `$generateNodesFromDOM`. Strips: `<style>` / `<script>` blocks, every `style=` attribute, every `class=` attribute, `<font>` tags, MS-Office and Google Docs cruft (`<o:p>`, `mso-*`). | "Pasting from Word/Google Docs yields clean HTML" is an explicit AC. |
| 6 | Bio empty-state copy | Show 3 prompt bullets when `bio` is empty — "Como você descreve sua música?", "Onde já tocou?", "Que projetos definem seu trabalho?". Disappears once the editor has any content. | PRD §3 Emerging DJ persona "needs prompts". |
| 7 | Services validation | Form-level: empty `title` blocks save (inline `role="alert"`). Max 8 items per `ProfileContent.services` array. `description` is optional (max 240 chars per existing schema). | Spec ACs + existing schema constraints. |
| 8 | Services drag-reorder | dnd-kit (same pattern as `SectionRail`). The reorder updates the entire `services` array via `applyMutation('content', { services: nextArray })`. Optimistic; preview reflects immediately. | Reuse existing infra; no new deps. |
| 9 | Locale | The EditCard accepts `locale: 'pt-BR' \| 'en'` (defaults to `pt-BR`). The PATCH route already accepts `?locale=`. Locale tabs UI is task-29; structurally we're ready. | PRD §10 Phase 1 = PT-only. Task-29 retrofit is one prop drill. |
| 10 | Plain-text projection | New `lib/editor/rich-text/extract-plain.ts` walks the state JSON returning plain text. Used by SEO meta fallback (task-20) + character counters. | Don't store derived state; compute on demand. |

## Cross-references

- PRD §6.3 (Bio + Services), §6.4 (public render), §10 (i18n).
- task-08 (`ProfileContent.bio` richText, `services` array, `ownsViaProfile` predicate), task-09 (EditorPane delegation), task-10 (`/api/profiles/[id]/content` PATCH route, EditorClient triple-buffer pattern, dnd-kit infra).
- task-19 (public route — `<RichTextRender>` ships here, task-19 mounts it).
- task-29 (locale tabs).

## File inventory (deliverables)

### Deps
- `bun add lexical @lexical/react @lexical/rich-text @lexical/list @lexical/link @lexical/utils @lexical/html`.

### Pure helpers (TDD)
- `lib/editor/rich-text/sanitize-paste.ts` (+ test) — `sanitizePastedHtml(html)` strips style/class/font and Word/Docs cruft. Tested against fixture HTML strings (no DOM).
- `lib/editor/rich-text/extract-plain.ts` (+ test) — `extractPlainText(state)` walks Lexical JSON → string. Handles paragraphs, headings, lists.
- `lib/editor/rich-text/is-empty.ts` (+ test) — `isEmptyLexicalState(state)` returns true for `null`, `undefined`, or a state whose root has no text content. Drives the empty-state copy.
- `lib/editor/services-validate.ts` (+ test) — `validateServiceItem`, `validateServicesArray`. Max 8 items, title required.
- `lib/editor/services-reorder.ts` (+ test) — `reorderServices(arr, fromIndex, toIndex)` pure helper.

### Renderer (used by editor preview AND task-19's public route)
- `components/profile/rich-text/RichTextRender.tsx` — server-renders Lexical state JSON via the JSON walker. No Lexical imports. Tests render fixture states + assert h2/h3/bold/italic/list/link emit the right tags.
- `components/profile/rich-text/RichTextRender.test.tsx`.

### Editor — Bio
- `components/editor/rich-text/BioEditor.tsx` — Lexical composer client component. Locked toolbar via `nodes` allowlist. `onChange` debounce passes the new state JSON via `onMutate('content', { bio: state })`.
- `components/editor/rich-text/Toolbar.tsx` — button row + active-state via `useLexicalComposerContext`.
- `components/editor/rich-text/PastePlugin.tsx` — Lexical plugin: intercepts paste, runs `sanitizePastedHtml`, hands to `$generateNodesFromDOM`.
- `components/editor/rich-text/BioEditor.test.tsx` — tests render the editor in jsdom + assert basic interactions where possible (toolbar buttons render; paste sanitization is unit-tested separately).
- `components/editor/sections/AboutEditCard.tsx` (+ test) — composes `<BioEditor>` + the empty-state prompt copy + character counter.

### Editor — Services
- `components/editor/sections/ServicesEditCard.tsx` (+ test) — list of cards with title/description inputs; "+ Adicionar serviço" button; drag handles; per-item validation; max-8 cap; inline `role="alert"` on empty title.

### Public renderers
- `components/profile/sections/AboutRender.tsx` — replace the tagline-only stub: render the localized bio via `<RichTextRender />`.
- `components/profile/sections/ServicesRender.tsx` — already lists titles + descriptions; no change needed.

### Section registry + EditorPane
- `lib/editor/sections.ts` — flip `about.hasEditor = true`, `services.hasEditor = true`.
- `components/editor/EditorPane.tsx` — add the two cases.

### E2E
- `tests/e2e/editor-bio-services.spec.ts` — `@full`: type into the bio, paste a styled fragment (asserting cleaning happens), reorder a service, confirm autosave fires.

### Docs
- `docs/runbooks/dev-editor.md` — append: how to test bio paste sanitization + services reorder.

## Implementation sequence

1. **Add deps** (Lexical packages).
2. **Pure helpers (TDD).** sanitize-paste, extract-plain, is-empty, services-validate, services-reorder.
3. **`<RichTextRender />` (TDD).** Server-renders Lexical JSON. Used by both editor preview and (future) public route.
4. **Lexical primitives.** Toolbar, PastePlugin, BioEditor.
5. **AboutEditCard + ServicesEditCard (TDD on validation + reorder gates).**
6. **Wire into EditorPane** (flip the two `hasEditor` flags).
7. **AboutRender extension** (server-side bio render via `<RichTextRender />`).
8. **E2E ladder.**
9. **Verification matrix.**

## Acceptance evidence (Verification Matrix)

| AC | How verified |
|---|---|
| Pasting Word/Docs yields clean HTML | `sanitize-paste.test.ts` covers `<style>`, `style=` attrs, `<font>`, MS Office `mso-*` tags, GDocs `id`/`class` attrs. Each fixture asserted to come out stripped. |
| Reordering services persists immediately | `ServicesEditCard.test.tsx` simulates drag-end → `onMutate('content', { services: reordered })`. The optimistic cache flow drives preview re-render. |
| Bio renders identically in editor preview + public page | Same `<RichTextRender />` component in both places. Test: a fixed Lexical JSON renders to identical DOM in both contexts. |
| Saving Services with empty title blocked + inline error | `ServicesEditCard.test.tsx` covers: title cleared → `role="alert"` visible, save handler returns w/o calling onMutate. |

## Test plan (TDD)

- **Unit:** all 5 helpers, `<RichTextRender />`, AboutEditCard validation/empty-state, ServicesEditCard validation + reorder.
- **Integration:** none — covered by ProfileRenderer's existing fixture tests once AboutRender uses `<RichTextRender />`.
- **E2E:** `@full` paste-sanitize + reorder.

## Out of scope (explicit)

- AI-assisted bio generation (spec scope-out).
- Locale tab UX — task-29.
- Image embeds in bio — out of MVP.
- Code blocks / blockquotes / strikethrough — toolbar locked to the 5 features.
- Server-side validation of services-array max-8 — relies on Payload's array-field constraint config (already in collection schema; no extra route work).

## Risks

- **R1 — Lexical version mismatch with Payload's bundled Lexical.** If our explicit `lexical` is a different major than `@payloadcms/richtext-lexical` ships internally, the JSON shapes might diverge. *Mitigation:* lock Lexical to the same major Payload uses (read from `node_modules/@payloadcms/richtext-lexical/package.json`). CI typecheck catches signature drift.
- **R2 — Paste from Word produces a 200KB Lexical state.** Storing it slows every editor-bundle fetch. *Mitigation:* the sanitizer drops 90%+ of MS-Office payload before Lexical imports. Add a soft 50KB warning in the editor (post-MVP).
- **R3 — Custom renderer drift from Lexical's canonical output.** *Mitigation:* `<RichTextRender />` test fixtures are diffs against Payload's own `lexicalHTML` output, captured once and locked.
- **R4 — Services array reorder conflict with concurrent edits.** Two tabs reorder simultaneously, last-write-wins. *Mitigation:* same as task-09 — `onError` invalidates the bundle; we accept last-write-wins for v1 (it's a single-user collection by design).
- **R5 — Lexical pulls in `react-server-dom` peer issues.** Lexical primitives are client-only; importing them server-side breaks. *Mitigation:* `BioEditor.tsx` is `'use client'`; the renderer is the only thing the public route imports.

## Done when

1. All 5 pure helpers green; `<RichTextRender />` tests green.
2. AboutEditCard + ServicesEditCard render in `/dashboard/profile/<id>` against the seeded demo profile.
3. Pasting a fragment with `style="..."` from a real GDoc yields clean output (manually verified + sanitize-paste tests cover the fixture).
4. Reordering services via drag updates the preview within 200ms; autosave fires.
5. AboutRender (public-side) renders the bio identically to the editor preview.
6. `pnpm test` + `pnpm typecheck` green; e2e smoke green.
7. Plan file (this doc) committed alongside implementation.
