# Task 29 — Implementation Plan (RFC-Lite)

> Architectural artifact for [task-29-i18n-next-intl.md](./task-29-i18n-next-intl.md).
> Authored under the Maestro protocol. Length: < 300 lines.

## Why

PRD §10 sets PT-BR as v1 launch + EN as fast-follow. The user has additionally promoted **ES (Spanish)** from the v2 backlog (task-34) into task-29's scope, so PR-A ships three locales instead of two. The scaffold is a stub: `i18n/request.ts` returns a fixed `en` with empty messages, every visible string is hardcoded PT-BR, and `<html lang="pt-BR">` is baked into the root layout. The marketing footer already advertises a PT/EN toggle that's disabled with "Em breve". Nothing works yet.

## Slice

Task-29 is sliced into three independently-shippable PRs. **This plan covers PR-A only.** PR-B and PR-C will get their own RFC-Lites after PR-A lands.

- **PR-A (this) — Chrome.** Locale resolver, message catalogs, EN+ES drafts, dynamic `<html lang>`, working 3-way toggle in the marketing footer, CI key-parity check. The marketing site, the legal pages, and the consent banner become trilingual. Public profile + editor untouched.
- **PR-B — Public profile.** Payload `ProfileContent` becomes per-locale (Payload v3 localization config + DB migration), fallback banner ("Original in PT"), `<link rel="alternate" hreflang>` per locale, locale toggle on `/[slug]`.
- **PR-C — Editor + dashboard.** Per-content-row locale switcher in the editor; dashboard chrome translated.

## Decisions locked (PR-A)

| # | Axis | Decision | Rationale |
|---|---|---|---|
| 1 | Locale set | `pt` (default), `en`, `es`. ES brought forward from task-34 per user. | User delegation; minor incremental cost over PT+EN since the catalog structure is locale-agnostic. |
| 2 | Locale code shape | Short codes (`pt`/`en`/`es`) for catalogs, cookies, and `next-intl`'s `locale` field. BCP-47 (`pt-BR`/`en`/`es`) used **only** for the `<html lang>` attribute and (later, in PR-B) hreflang tags. | next-intl uses short codes by convention; HTML/SEO want BCP-47. A `toBcp47()` helper bridges. |
| 3 | Resolution policy | Cookie (`NEXT_LOCALE`) wins → else `Accept-Language` parsed and matched against the supported set → else default `pt`. Per PRD §10 + Appendix B. | PRD-mandated. The cookie wins so a user's manual toggle survives across requests. |
| 4 | Routing | **No path prefix**. Single canonical URL per route. Locale flows through cookie + headers, not the URL. | Task spec implementation note: "single canonical URL per profile". Saves us a major re-routing migration on the public profile in PR-B. |
| 5 | Message catalog format | One JSON file per locale at `messages/{pt,en,es}.json`. Flat-ish keys with namespaces (`hero.title`, `footer.nav.privacy`, etc.) — same shape as the existing `lib/marketing/copy.ts` so we can mechanically port. | next-intl's default. JSON is also the easiest format for the eventual content-team handoff (Crowdin-style import/export). |
| 6 | EN + ES authorship | Engineering-drafted v1 translations. A `_meta` block at the top of each non-default file flags it as draft pending content review. | PRD §10 says PT is launch, EN is fast-follow; ES is now part of that fast-follow per the user. Real translations beat placeholders for QA. |
| 7 | Toggle placement (PR-A) | Marketing footer only. The 3-button group already exists in `MarketingFooter.tsx` (PT enabled, EN disabled-with-hint); becomes 3 active buttons (PT / EN / ES) that set the cookie and reload. Consent banner + legal pages render in whatever locale is resolved. | Smallest credible UX. Public-profile + dashboard toggles wait for their respective PRs. |
| 8 | Server action vs client toggle | Cookie write happens via a tiny server action (`'use server'`). The button calls the action then `router.refresh()`. | Server-side cookie write avoids `Set-Cookie` on a client mutation; the cookie is HttpOnly-eligible (we'll set it without HttpOnly because client code never reads it; it's middleware-only territory). |
| 9 | Key-parity CI check | `scripts/check-i18n-keys.ts` walks every key in `messages/pt.json` and asserts presence in `en` + `es`. Adds a `i18n:check` script. Tests are pure-fn unit tests on the diff helper, identical posture to `check-bundle-budget`. | AC #3. |
| 10 | `<html lang>` | Becomes `<html lang={toBcp47(resolvedLocale)}>` via `getLocale()` in the root layout (now async). | Required for a11y and SEO; keeps task-25's `pt-BR` default for the PT branch. |
| 11 | Out of scope (PR-A) | Public profile localization, Payload `ProfileContent` per-locale rows, hreflang tags, fallback banner, dashboard/editor strings, ICU plurals (we have zero today), `Intl.DateTimeFormat` substitutions in user-facing dates (we render no dates today on these surfaces). | Each is a separate, targeted follow-up. |

## File inventory (PR-A)

### New
- `lib/i18n/locale.ts` — pure helpers: `SUPPORTED_LOCALES`, `DEFAULT_LOCALE`, `negotiateLocale(opts: { acceptLanguage, cookie })`, `toBcp47(locale)`. No I/O.
- `lib/i18n/locale.test.ts` — TDD coverage for negotiation + BCP-47 mapping.
- `lib/i18n/server.ts` — thin server-only wrapper around `getLocale()` from next-intl, plus the `setLocaleAction` server action that writes the `NEXT_LOCALE` cookie and triggers a refresh.
- `messages/pt.json` — full chrome catalog (port of existing `copy.ts` + `legalCopy.ts` + `consent` strings).
- `messages/en.json` — engineering-drafted EN translations.
- `messages/es.json` — engineering-drafted ES translations.
- `scripts/check-i18n-keys.ts` — pure-fn diff (exported) + CLI runner. Same shape as `scripts/check-bundle-budget.ts`.
- `scripts/check-i18n-keys.test.ts` — unit tests on the diff helper.
- `components/marketing/LocaleToggle.tsx` — renders 3 buttons; calls `setLocaleAction` then `router.refresh()`.
- `tests/e2e/locale-toggle.spec.ts` — `@smoke` Playwright spec asserting cookie-driven locale persistence on `/`.

### Modified
- `i18n/request.ts` — replace skeleton with cookie + Accept-Language negotiation + JSON-imported messages per locale.
- `app/layout.tsx` — make async; resolve locale; `<html lang={toBcp47(locale)}>`; mount `<NextIntlClientProvider locale messages>`.
- `app/page.tsx` (marketing landing) + every component under `components/marketing/` — replace `copy.x.y` references with `useTranslations('namespace').t('x.y')`.
- `components/CookieConsentBanner.tsx` — same swap.
- `components/legal/LegalPage.tsx` + `app/privacy/page.tsx` + `app/terms/page.tsx` — same swap.
- `components/marketing/MarketingFooter.tsx` — replace the disabled PT/EN block with the new `<LocaleToggle />`.
- `lib/marketing/copy.ts` and `lib/legal/copy.ts` — **deleted**. Their structure becomes the seed of `messages/pt.json`.
- `package.json` — add `i18n:check` script.

### Untouched
- `app/[slug]/**` — public profile. PR-B's territory.
- `app/dashboard/**`, `app/onboarding/**`, the editor — PR-C's territory.
- Middleware — locale resolution lives in `i18n/request.ts` (next-intl server config), not the edge. No middleware changes.

## Implementation sequence

1. **Plan doc** (this).
2. **`lib/i18n/locale.ts` (TDD).** Negotiation matrix + BCP-47 helper.
3. **Seed `messages/pt.json`** by porting `copy.ts` + `legalCopy.ts` + consent strings.
4. **Draft `messages/en.json` + `messages/es.json`** with full key parity.
5. **`scripts/check-i18n-keys.ts` (TDD).** Reuse the lock-file/diff posture from `check-bundle-budget`.
6. **Wire `i18n/request.ts`** to read cookie/Accept-Language and load the right catalog.
7. **Make `app/layout.tsx` async**, resolve locale, mount the provider, set `<html lang>`.
8. **Server action + LocaleToggle component.**
9. **Migrate every consumer** (marketing components, banner, legal pages) from `copy.x` to `useTranslations`.
10. **Delete `lib/marketing/copy.ts` and `lib/legal/copy.ts`.**
11. **Footer wiring** — replace the disabled PT/EN buttons with `<LocaleToggle />`.
12. **`tests/e2e/locale-toggle.spec.ts`.**
13. **Verification (typecheck + tests + build + e2e + bundle:check).**

## Acceptance evidence (PR-A)

| AC | How verified |
|---|---|
| Translation strings live in `messages/{en,pt}.json` (and `es.json`) and pass a CI check that all keys exist in every locale file | New `scripts/check-i18n-keys.ts` + unit tests; `i18n:check` package script. |
| Cookie persists locale across sessions | `tests/e2e/locale-toggle.spec.ts`: clicks ES → reloads → asserts the page re-renders ES strings + `<html lang="es">`. |

ACs that belong to PR-B (public profile fallback banner, hreflang) are explicitly out of scope here.

## Test plan (PR-A)

- **Unit:** `negotiateLocale` (matrix of Accept-Language headers and cookie overrides), `toBcp47`, `diffMessageKeys`.
- **E2E (`@smoke`):** load `/`, assert PT default; click ES toggle, assert reload renders ES strings + `<html lang="es">`; reload, assert persistence; check `/privacy` reflects the toggled locale.

## Risks

- **R1 — Bundling all three catalogs into every route.** next-intl can either pre-bundle or dynamic-import. *Mitigation:* dynamic `import('@/messages/' + locale + '.json')` in `i18n/request.ts` so only the active locale ships. Bundle-budget gate (task-26) catches a regression if it leaks.
- **R2 — Engineering ES translations have errors.** Native review hasn't happened. *Mitigation:* the `_meta.draft: true` flag in non-PT files; runbook note for the content team; PR description calls it out. Errors are content bugs, not regressions.
- **R3 — Locale-leaks between requests.** A single in-memory module-level cache across requests (e.g. caching the resolved locale on a global) would leak between users. *Mitigation:* resolve per-request via `next-intl/server`'s `getLocale()`; never cache a resolved locale at module scope.
- **R4 — Cookie name collision.** `NEXT_LOCALE` is the next-intl convention but Next.js itself sets the same name for its built-in i18n routing (which we don't use). *Mitigation:* we don't enable Next.js's built-in i18n config (no `i18n` in `next.config.ts`) — only next-intl reads/writes the cookie.

## Done when (PR-A)

1. `bun run i18n:check` exits 0 — every PT key has an EN + ES counterpart.
2. `bun run typecheck` + `bun run test` + `bun run build` green.
3. `tests/e2e/locale-toggle.spec.ts` green: PT default → ES toggle → reload still ES → `<html lang="es">`.
4. `bun run bundle:check` green; only the PT chunk is in the route's First Load JS by default.
5. The marketing landing, the consent banner, `/privacy`, and `/terms` render in PT, EN, **and** ES.
6. Plan file (this doc) committed alongside implementation.

## Out of scope (later PRs)

- Public profile localization, hreflang, fallback banner (PR-B).
- Per-locale `ProfileContent` rows + Payload localization config + migration (PR-B).
- Editor locale switcher + dashboard chrome translation (PR-C).
- French (still v2/task-34).
- Server-side rendering of `Intl.DateTimeFormat`/`Intl.NumberFormat` for user-facing values — no such values on PR-A surfaces today.
