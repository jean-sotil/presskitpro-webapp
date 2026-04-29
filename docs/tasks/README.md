# PressKit.pro — Task Index

> Source of truth: [presskit-pro-prd.md](../presskit-pro-prd.md) (v0.2 — 2026-04-29)
> Owner role: Technical Lead + Product Manager
> Last updated: 2026-04-29

This folder contains the full work breakdown of the PressKit.pro PRD. Each `task-NN-*.md` file is a self-contained ticket with **scope, acceptance criteria, dependencies, and Definition of Done** so any engineer can pick it up cold.

---

## How to read a task file

Every task uses the same template:

1. **Summary** — one-liner.
2. **PRD references** — section numbers in the PRD this task implements.
3. **Dependencies** — which task IDs must land first.
4. **Scope (in / out)** — explicit boundaries.
5. **Acceptance criteria** — testable, binary checks.
6. **Implementation notes** — files, libraries, gotchas.
7. **Definition of Done** — per Appendix C of the PRD.

---

## Phase breakdown

### Phase 0 — Foundation (week 1)
Setup that everything else depends on. Block-and-tackle infra.

- [task-01-project-setup.md](task-01-project-setup.md) — Next.js + Tailwind + tooling scaffold
- [task-02-supabase-payload-spike.md](task-02-supabase-payload-spike.md) — Validate the dual-schema architecture
- [task-03-design-tokens-editorial-nightlife.md](task-03-design-tokens-editorial-nightlife.md) — Default theme tokens & primitive components
- [task-04-ci-cd-and-quality-gates.md](task-04-ci-cd-and-quality-gates.md) — CI: typecheck, lint, axe, Playwright, Lighthouse

### Phase 1 — MVP (weeks 2–8)
Single-locale, oEmbed integrations, no card at signup, external press kit links.

- [task-05-auth-supabase.md](task-05-auth-supabase.md) — Email magic link + Google OAuth
- [task-06-onboarding-wizard.md](task-06-onboarding-wizard.md) — 5-step wizard + slug reservation
- [task-07-slug-rules-and-reservations.md](task-07-slug-rules-and-reservations.md) — Validation, blocklist, profanity, soft-holds
- [task-08-payload-collections.md](task-08-payload-collections.md) — All Payload collections per §7
- [task-09-profile-editor-shell.md](task-09-profile-editor-shell.md) — Two-pane editor, autosave, publish/unpublish
- [task-10-editor-section-hero.md](task-10-editor-section-hero.md) — Hero block (portrait, logo, tagline, CTA)
- [task-11-editor-section-bio-services.md](task-11-editor-section-bio-services.md) — About + Services
- [task-12-editor-section-photo-gallery.md](task-12-editor-section-photo-gallery.md) — Drag-drop, reorder, alt-text gate
- [task-13-editor-section-social-links.md](task-13-editor-section-social-links.md) — Social links manager
- [task-14-editor-section-contact.md](task-14-editor-section-contact.md) — WhatsApp / email / contact form toggle
- [task-15-editor-section-press-kit-link.md](task-15-editor-section-press-kit-link.md) — External URL + HEAD validation + provider detect
- [task-16-editor-section-soundcloud-oembed.md](task-16-editor-section-soundcloud-oembed.md) — Featured track via oEmbed
- [task-17-editor-section-instagram-oembed.md](task-17-editor-section-instagram-oembed.md) — Manual IG embed flow
- [task-18-theme-tab-and-contrast-gate.md](task-18-theme-tab-and-contrast-gate.md) — Color presets, font pairs, layout, WCAG gate
- [task-19-public-profile-page.md](task-19-public-profile-page.md) — RSC public page, ISR, anchor nav, mosaic
- [task-20-seo-foundation.md](task-20-seo-foundation.md) — Sitemap, robots, meta, JSON-LD, hreflang
- [task-21-marketing-landing.md](task-21-marketing-landing.md) — `/`, hero, examples, FAQ
- [task-22-pricing-page.md](task-22-pricing-page.md) — Tier table + CTA flow
- [task-23-stripe-trial-to-paid.md](task-23-stripe-trial-to-paid.md) — 14-day trial logic + Stripe Checkout
- [task-24-analytics-pipeline.md](task-24-analytics-pipeline.md) — Event capture + dashboard charts
- [task-25-accessibility-baseline.md](task-25-accessibility-baseline.md) — WCAG 2.2 AA audit + automation
- [task-26-performance-budget.md](task-26-performance-budget.md) — LCP/INP/CLS targets + Lighthouse 95
- [task-27-security-rls-and-rate-limits.md](task-27-security-rls-and-rate-limits.md) — RLS, encryption, rate limits
- [task-28-observability-sentry-posthog.md](task-28-observability-sentry-posthog.md) — Sentry + PostHog wiring

### Phase 2 — V1 (weeks 9–14)
i18n, link-rot defenses, billing variants, compliance.

- [task-29-i18n-next-intl.md](task-29-i18n-next-intl.md) — PT/EN with cookie-based locale, hreflang, fallback matrix
- [task-30-press-kit-health-check-job.md](task-30-press-kit-health-check-job.md) — Daily HEAD-check + email alerts + auto-hide
- [task-31-billing-annual-and-agency.md](task-31-billing-annual-and-agency.md) — Annual + Agency tier
- [task-32-slug-reclamation-policy.md](task-32-slug-reclamation-policy.md) — 30-day inactivity reclaim + 90-day grace
- [task-33-lgpd-data-export-delete.md](task-33-lgpd-data-export-delete.md) — Self-serve export + delete

### Phase 3 — Backlog / V2
Tracked here only as stubs; promoted to full tasks when prioritized.

- [task-34-v2-backlog.md](task-34-v2-backlog.md) — Custom domains, IG Graph API, /explore, ES/FR, custom CSS, public API

---

## Suggested execution order

Foundation tasks (01–04) run sequentially, then MVP tasks parallelize across two tracks:

- **Track A (Editor + Backend):** 05 → 06/07 → 08 → 09 → 10–17
- **Track B (Public + Platform):** 03 → 18 → 19 → 20 → 21/22 → 23/24
- **Cross-cutting (continuous):** 25, 26, 27, 28

V1 tasks (29–33) land after MVP gates Lighthouse ≥ 95, axe-zero-criticals, and 80%+ self-serve onboarding internally.

---

## Definition of Done (applies to every task — from PRD Appendix C)

A task is "done" only when:

1. Lives behind a feature flag if risky.
2. Has unit tests on business logic.
3. Has a Playwright E2E for the happy path.
4. Passes `axe-core` automated a11y check.
5. Has translated strings for all launch locales (after task-29 lands).
6. Documented in the internal handbook.
7. Manually QA'd on iPhone Safari, Android Chrome, desktop Chrome, Firefox.
