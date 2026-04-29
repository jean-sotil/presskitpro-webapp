# Task 18 — Theme Tab & WCAG Contrast Gate

## Summary
Editor's "Theme" tab where the DJ picks color preset (or custom hex), font pair, hero style, and gallery layout, with WCAG AA contrast enforced at save-time.

## PRD references
- §12.2 (per-profile theme tokens), §12.3 (constraints), §11 (a11y).

## Dependencies
- task-09, task-03, task-08 (`Themes` collection).

## Scope (in)
- Color presets: 6 backgrounds × 12 accents (curated). Custom hex supported with live picker.
- Live contrast indicator: shows the WCAG ratio for `text vs bg` and `accent vs bg`.
- Font-pair selector: 8 curated pairs with rendered samples.
- Hero style switcher (3 options).
- Gallery layout switcher (3 options).
- Save blocked when `text/bg < 4.5:1` or `accent/bg < 3:1`; inline explanation points to the failing pair.
- `Themes.contrastValidatedAt` updated on successful save; publish blocked if null/stale (>30 days).

## Scope (out)
- Custom CSS / CSS variable overrides beyond the documented tokens (v2).
- User-uploaded fonts (v2).

## Acceptance criteria
- [ ] Picking a low-contrast custom hex pair surfaces an inline error with the exact ratio.
- [ ] Switching font pair updates the preview without a full reload.
- [ ] Theme record persists `colorPresetId` when a preset is chosen, or the raw hex values when custom.
- [ ] Public page renders the theme via CSS-variable injection in `<head>` — no client-side recomputation.

## Implementation notes
- Use `wcag-contrast` or implement WCAG 2.x relative-luminance directly.
- Render the public page's theme as a `<style>` tag in `<head>` containing `:root { --bg: …; --accent: …; }` etc., per §12.3.

## Definition of Done
Per Appendix C.
