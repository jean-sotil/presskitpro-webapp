# Task 33 — Implementation Plan (RFC-Lite)

> Architectural artifact for [task-33-lgpd-data-export-delete.md](./task-33-lgpd-data-export-delete.md).
> Authored under the Maestro protocol. Length: < 300 lines.

## Why

PRD §14 + §17: Brazilian market launch obliges LGPD compliance — every account holder must be able to (a) export their data and (b) delete their account. v1 ships self-serve in the dashboard; the actual data fan-out (auth, storage, Stripe, observability) runs on a 14-day-grace cron. Today none of this exists; users have to email support.

The full task slices into **three independently-shippable PRs**, each with its own AC subset. This plan covers all three but executes them sequentially.

## Slice

- **PR-A — Soft-delete + privacy settings UI.** Settings page at `/dashboard/settings/privacy` with two CTAs; the "Delete my account" path runs a server action that flips `Users.deletionRequestedAt`, sets every owned `Profile.status='unpublished'`, and signs the user out. Public profile route gains a "soft-deleted → 404" branch ahead of the paused-page branch. No external fan-out.
- **PR-B — Data export job.** "Export my data" CTA triggers a server action that gathers every user-scoped row + media URLs into a JSON ZIP, uploads to Supabase Storage at `exports/<userId>/<timestamp>.zip`, and emails a 24h signed URL.
- **PR-C — Hard-delete cron.** Daily sweep of users whose `deletionRequestedAt` is more than 14 days old. Fans out to Payload (cascade-delete owned rows), Supabase Auth (`auth.admin.deleteUser`), Supabase Storage (delete `avatars/<userId>/*` and `gallery/<userId>/*`), Stripe Customer (cancel + delete). PostHog + Sentry are logged only (observability wiring is task-28, which was deferred).

## Audit — what's already shipped

| Surface | Status | Where |
|---|---|---|
| Profile.status enum (`draft`/`published`/`unpublished`/`paused`/`soft-released`) | ✅ done | [Profiles.ts:118](../../payload/collections/Profiles.ts#L118) — extended in task-32 |
| Public profile renders `paused` template at HTTP 200 | ✅ done in task-23 | [app/[slug]/page.tsx](../../app/%5Bslug%5D/page.tsx) |
| Cron pattern + `CRON_SECRET` Bearer | ✅ done | task-23 / task-30 / task-32 |
| Email transport + multi-locale templates | ✅ done | [lib/email/send.ts](../../lib/email/send.ts), task-30 + task-32 templates |
| Privacy page route | ✅ done in task-27 PR-2 | [app/privacy/page.tsx](../../app/privacy/page.tsx) — copy is editable via i18n |
| Stripe customer fields on `Users` | ✅ done | `stripeCustomerId`, `stripeSubscriptionId` |

## Decisions locked

| # | Axis | Decision | Rationale |
|---|---|---|---|
| 1 | Soft-delete signal | Add `Users.deletionRequestedAt: date, readOnly`. Setting it flips every owned `Profile.status='unpublished'` via the same server action that writes the timestamp. No new `users.status` enum needed — the timestamp's presence IS the soft-delete state. | Single source of truth; the existing cron-sweep pattern already filters on timestamps. |
| 2 | Public profile gate | `app/[slug]/page.tsx` — when the resolved profile's owner has `deletionRequestedAt`, return `notFound()` BEFORE the paused-template branch. | AC #4: "Soft-deleted profile's public URL returns 404, not paused-page." |
| 3 | Settings page route | `/dashboard/settings/privacy` (new). Server-side guarded same as `/dashboard` (Supabase session via the dashboard layout). Two large outline cards: Export + Delete, each with a confirmation modal. | Spec — privacy is the only setting that needs a route in v1. |
| 4 | Delete-confirmation UX | The modal requires the user to **type their own email** before the destructive button activates. Mirrors GitHub's destructive-action pattern. | Industry-standard double-confirm; resilient to accidental clicks. |
| 5 | Sign-out on soft-delete | After the soft-delete server action succeeds, the action calls `supabase.auth.signOut()` and redirects to `/?account_deleted=1`. The query string surfaces a one-time success banner on the marketing landing. | Closes the session immediately so a stale cookie can't authenticate to a soft-deleted account. |
| 6 | Hard-delete cron schedule | New route `/api/cron/hard-delete-users`, same Bearer auth as billing/press-kit/slug-reclaim. Vercel-side schedule lives outside the repo. Recommended cadence: 05:00 UTC daily. | Consistent with the four existing crons. |
| 7 | Hard-delete fan-out | (PR-C) — Stripe `customers.del`; Supabase Auth `auth.admin.deleteUser`; Supabase Storage delete via list+remove on `avatars` + `gallery`; Payload cascade-delete via `payload.delete` on Users (afterDelete hooks already cascade owned Profiles + ProfileContent + SocialLinks + Themes + Media + InstagramConnections + InstagramPosts via the `relationTo` foreign keys). PostHog + Sentry log-only. | Spec implementation note: "what we retain and why" — Stripe Customer is deleted, but invoice rows persist for tax (Stripe keeps them server-side; we don't store invoices locally). |
| 8 | Export ZIP shape | (PR-B) — `manifest.json` at the root (account email + timestamp + counts), then per-collection JSON files (`profiles.json`, `profile-content.json` with `_locale` field, `social-links.json`, `themes.json`, `featured-tracks.json`, `instagram-posts.json`, `analytics-rollups.json`). Media is referenced by signed Supabase Storage URLs (24h validity) inside `media-index.json`, NOT inlined as bytes. | AC #1: every collection accounted for. Inlining bytes would balloon the export for image-heavy users; 24h signed URLs let them download originals separately. |
| 9 | Audit log | Reuse `analytics_events` with `event_type IN ('account_export_requested', 'account_deletion_requested', 'account_deletion_finalized')`. | Same pattern as task-32; avoids a new collection. |
| 10 | Out of scope | Account-recovery flow within the 14-day grace (admin handles via Payload Admin); DPO automation portal (per spec scope-out); GDPR-specific provisions; account-merge after delete. | Spec scope-out + cost/value. |

## File inventory

### PR-A (this PR)
**New**
- `lib/account/soft-delete.ts` — pure helper: validates the typed-email confirmation, returns the action plan (set timestamp + unpublish profiles + sign out).
- `lib/account/soft-delete.test.ts` — typed-email match + mismatch + missing-user.
- `app/dashboard/settings/privacy/page.tsx` — server-rendered page with two CTAs.
- `app/dashboard/settings/privacy/actions.ts` — `'use server'` actions for export-request and delete-account.
- `app/dashboard/settings/privacy/PrivacyForms.tsx` — client component with the two confirmation modals.
- `tests/e2e/privacy-settings-auth.spec.ts` — `@smoke` 401 unauth on the settings page.

**Modified**
- `payload/collections/Users.ts` — `deletionRequestedAt` field (date, readonly).
- `payload-types.ts` — regenerated.
- `app/[slug]/page.tsx` — soft-deleted owner → 404 branch.
- `messages/{pt,en,es}.json` — settings page chrome + confirmation modal copy + success banner.

### PR-B (separate)
- `lib/account/build-export.ts` (+ test) — pure JSON-shape builder.
- `lib/account/storage-export.ts` — Supabase Storage upload + signed URL.
- `lib/email/templates/account-export.ts`.
- `app/dashboard/settings/privacy/actions.ts` — wire the export action to fire-and-forget the build/upload/email pipeline.
- `messages/*.json` — `email.accountExport.{subject,body}`.

### PR-C (separate)
- `lib/account/hard-delete.ts` (+ test) — pure orchestrator over fake adapters.
- `app/api/cron/hard-delete-users/route.ts` — Bearer-authed POST, wires live deps.
- `lib/email/templates/account-deleted.ts` (final-confirmation email).

## Implementation sequence (PR-A)

1. **Plan doc** (this).
2. **`lib/account/soft-delete.ts` (TDD).**
3. **Add `Users.deletionRequestedAt`; regen types.**
4. **i18n keys (8–10 strings × 3 locales).**
5. **`/dashboard/settings/privacy` server page + client modal component.**
6. **Server action for delete.**
7. **`/[slug]/page.tsx` 404 branch.**
8. **`tests/e2e/privacy-settings-auth.spec.ts`.**
9. **Verification (typecheck + tests + i18n:check + build + e2e + bundle:check).**

## Acceptance evidence

| AC | Status (after each PR) |
|---|---|
| Export ZIP contains every profile, ProfileContent locale, gallery image (or signed URLs to the originals), social links, themes, and analytics rollups | ⏳ PR-B |
| Hard-delete after grace removes the user from auth + Stripe + PostHog within 24h | ⏳ PR-C |
| Privacy policy updated to reflect the export + delete process | ✅ PR-A — i18n keys for `/privacy` already in messages catalogs; PR-A's policy update is one paragraph add |
| Soft-deleted profile's public URL returns 404, not paused-page | ✅ PR-A — `[slug]/page.tsx` checks owner.deletionRequestedAt before falling to the paused-template branch |

## Test plan (PR-A)

- **Unit:** `softDelete` matrix — typed-email matches, mismatch, missing user, already-soft-deleted (idempotent).
- **E2E (`@smoke`):** `/dashboard/settings/privacy` redirects to `/login` for unauthenticated visitors. Full delete-button click + confirmation flow lives in PR-A's full-tier (gated on `EDITOR_E2E_PROFILE_SLUG` once seeded).

## Risks

- **R1 — User soft-deletes then signs back in.** Within the 14-day grace, the dashboard still works because Supabase Auth still has the user; but `deletionRequestedAt` is set, all profiles are unpublished, and the public URL 404s. *Mitigation:* the dashboard surfaces a banner "Conta marcada para exclusão em N dias" with a "Cancel deletion" CTA (clears the timestamp + republishes is OUT of scope for v1; admin handles via Payload Admin). PR-A only ships the banner copy — the cancel flow is documented in the runbook for now.
- **R2 — Stripe holds invoices we don't control.** Stripe retains invoice data for legal/tax even after `customers.del`. *Mitigation:* the privacy policy text ships a paragraph that names this exception. (PR-B/C update.)
- **R3 — Analytics rollups outlive the user.** `analytics_daily_rollups` are aggregate per-profile; once the profile row is deleted (cascade), the rollups remain anonymized (no user-identifiable data). *Mitigation:* documented in the privacy policy.
- **R4 — Public profile cache.** `/[slug]` is `force-dynamic` since task-29 PR-B, so the soft-delete 404 is observable on the next request. No CDN purge needed.

## Done when (PR-A)

1. `bun run typecheck` + `bun run test` + `bun run i18n:check` + `bun run build` + `bun run bundle:check` green.
2. `tests/e2e/privacy-settings-auth.spec.ts` green: 401-equivalent (redirect) on the settings page without a session.
3. Manually verifiable: visit `/dashboard/settings/privacy` after seeding an account, click "Delete my account", confirm via the typed-email modal — owned profiles flip to `unpublished`, the user is signed out, and `/<slug>` returns 404.
4. Plan doc (this) committed alongside PR-A.

## Out of scope (post-PR-C)

- DPO automation portal (PRD scope-out).
- GDPR Right-to-Object workflows.
- Account-merge / restore-from-backup after hard-delete.
- A "Cancel deletion" UI inside the 14-day window (admin handles via Payload Admin for v1; CTA copy is shipped but the action is documented as a manual flip in the runbook).
- PostHog / Sentry actual deletion calls (logged-only stubs until task-28 wires the SDKs).
