# Task-29 — Follow-ups

> Companion to [task-29-i18n-next-intl.plan.md](./task-29-i18n-next-intl.plan.md).
> Captures the work that PR-A + PR-B intentionally left in scope for later commits.

## What landed in PR-A + PR-B

PR-A + PR-B together satisfy every AC in [task-29-i18n-next-intl.md](./task-29-i18n-next-intl.md):

| AC | Where it landed |
|---|---|
| Profile with only EN content shows EN to PT visitor with fallback banner | PR-B — banner in [app/[slug]/page.tsx](../../app/%5Bslug%5D/page.tsx); `Vary: Cookie` in [middleware.ts](../../middleware.ts) |
| Cookie persists locale across sessions | PR-A — [lib/i18n/server-actions.ts](../../lib/i18n/server-actions.ts) sets `NEXT_LOCALE`; [tests/e2e/locale-toggle.spec.ts](../../tests/e2e/locale-toggle.spec.ts) verifies |
| Translation strings in `messages/{en,pt}.json` (and `es.json`) + CI key-parity check | PR-A — `bun run i18n:check` (104 keys × 3 locales) |
| `<link rel="alternate" hreflang>` + `x-default` per available locale | PR-B — `generateMetadata` in `app/[slug]/page.tsx`; e2e in [tests/e2e/public-profile-i18n.spec.ts](../../tests/e2e/public-profile-i18n.spec.ts) |

All four are testable, binary, and green in CI today.

## What remains — PR-C (editor + dashboard chrome)

Spec §13 says "next-intl integrated for app chrome (UI labels, dashboard, marketing)." Marketing is done. **Dashboard, onboarding, auth pages, and the editor are still PT-only.** Migrating them is multi-day work and was scoped out of PR-A/PR-B per the original RFC-Lite.

### Surface area

Files with PT-BR strings that need migration to `useTranslations`:
- `app/dashboard/profile/[id]/EditorClient.tsx`
- `components/editor/PublishDialog.tsx`
- `components/editor/ThemeTab.tsx`
- `components/editor/sections/InstagramPostsEditCard.tsx`
- `components/editor/sections/AboutEditCard.tsx`
- `components/editor/sections/FeaturedTrackEditCard.tsx`
- (plus the rest of `components/editor/sections/*` and `app/onboarding/**`)

Estimated string count: 200+ across the editor, ~60 in onboarding, ~20 in login/signup. Full coverage requires a translator pass on EN + ES.

### Plus — editor locale switcher (PR-C-2)

Today the artist edits the `defaultLocale`'s `ProfileContent` row only. Authoring EN + ES translations requires a per-row locale switcher in the editor that:

1. Reads the active editing locale from URL state or a tab control.
2. Threads `?locale=` through every autosave POST/PUT to the Payload Local API.
3. Refetches the bundle when the locale changes.
4. Indicates which fields are filled in which locales (e.g. a small chip on each section title).

This is the artist-facing twin of the public-profile locale toggle. It's the gating piece for actually publishing multi-locale profiles. **Until PR-C-2 lands, the only profiles with non-PT content will be admin-edited via the Payload Admin UI** (which already supports `?locale=` natively).

### Recommended slicing

- **PR-C-1 — Auth + onboarding chrome.** Translate `/login`, `/signup`, `/onboarding/*`. Smallest user-facing surface; one or two reviewer days.
- **PR-C-2 — Editor locale switcher (data path).** The substantive piece: route + autosave + bundle refetch. New e2e covering "edit ES tagline, save, reload, see ES tagline".
- **PR-C-3 — Editor chrome strings.** Translate the 200+ labels in `components/editor/**`. Mostly mechanical.

Each is independently revertable; PR-C-2 is the only one that touches data flow (and the only one that requires an AC bump).

## Other deferred items

- **CSP enforce flip** (task-27 follow-up) — the runbook documents the seven-day soak; ship once observability lands.
- **Per-locale ISR for `/[slug]`** — the public profile is currently `force-dynamic`. PR-C-4 (or a perf pass after task-28) can reintroduce ISR keying by `Accept-Language` + `NEXT_LOCALE` cookie.
- **French (FR)** — still v2/task-34 even after the user promoted ES.
- **`Intl.DateTimeFormat` / `Intl.NumberFormat` substitutions** — no user-facing dates or numbers exist on translated surfaces today; will be added when task-31 (billing dates) and task-30 (last-checked timestamps) ship strings that need formatting.
