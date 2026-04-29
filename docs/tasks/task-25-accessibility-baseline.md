# Task 25 — Accessibility Baseline (WCAG 2.2 AA)

## Summary
Implement and verify all a11y commitments from §11 across both the public profile and the editor.

## PRD references
- §11 (Accessibility), §19 (zero critical axe violations), Appendix C (axe in DoD).

## Dependencies
- task-04 (axe in CI), task-19, task-09.

## Scope (in)
- Visible focus rings on every interactive control (use `:focus-visible`).
- Skip-to-content link on every public + dashboard page.
- Semantic landmarks: `<header>`, `<nav>`, `<main>`, `<footer>`, `<section>` with `aria-labelledby`.
- One `<h1>` per page (artist name on the public page).
- All form inputs have associated `<label>`; errors announced via `aria-invalid` + `role="alert"`.
- Embeds have descriptive `<title>` on iframes.
- `prefers-reduced-motion` honored everywhere.
- Manual screen-reader passes (NVDA on Windows, VoiceOver on macOS + iOS) before each release.
- Keyboard-only walkthrough recorded as a Playwright test for the editor and public page.

## Scope (out)
- WCAG AAA contrast (we target AA per §11).
- Sign-language video alternatives.

## Acceptance criteria
- [ ] axe CI returns zero critical/serious violations on key routes.
- [ ] Keyboard-only Playwright run completes the publish flow.
- [ ] Color contrast against the default theme passes 4.5:1 (text) and 3:1 (UI components/large text).
- [ ] Screen-reader pass log committed to `docs/qa/a11y-passes/` per release tag.

## Implementation notes
- The contrast gate at save-time (task-18) is the *content* layer; this task handles the *chrome* layer (editor, marketing, dashboard).
- Don't suppress axe rules without a written justification in `.axe-suppressions.md`.

## Definition of Done
Per Appendix C.
