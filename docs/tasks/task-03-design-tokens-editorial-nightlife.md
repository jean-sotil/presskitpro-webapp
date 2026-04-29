# Task 03 — Design Tokens & "Editorial Nightlife" Default Theme

## Summary
Translate §12 of the PRD into a working design system: CSS custom properties, Tailwind theme extension, font loading, and a primitives library (Button, Card, Section, Anchor, Tag, IconButton).

## PRD references
- §12.1 (Default theme), §12.2 (User-customizable tokens), §12.3 (Constraints), §11 (a11y).

## Scope (in)
- All tokens from the §12.1 table exposed as CSS variables on `:root`.
- Tailwind config consumes those variables (e.g. `bg: 'hsl(var(--bg))'` style, but using direct CSS-var references is acceptable).
- `next/font` loads the 8 curated font pairs from §12.2 with `display: 'swap'` and Latin + Latin-Extended subsets (PT-BR diacritics required).
- Film-grain overlay component (`<Grain />`) toggleable per profile.
- Numbered section markers component (`<SectionMarker number="01" label="SOBRE" />`).
- Storybook (or a `/_internal/preview` route in dev mode) showcasing every primitive.

## Scope (out)
- Per-profile theme overrides (task-18 wires the editor; task-19 injects them at render time).
- Custom CSS escape hatch (v2).

## Acceptance criteria
- [ ] Switching `--bg` and `--accent` at the document level recolors the entire app without re-rendering React.
- [ ] All 8 font pairs render correctly in PT and EN sample copy.
- [ ] No font CSS exceeds 50KB per pair after subsetting.
- [ ] `prefers-reduced-motion` disables the staggered fade-up reveal.
- [ ] Contrast lint script (`pnpm contrast:check`) verifies every preset combination passes WCAG AA.

## Implementation notes
- Locked rules per §12.2: spacing scale, type scale, line heights, motion timings are NOT user-customizable. Encode them as Tailwind theme constants, not CSS variables.
- Default radius is `0` — embrace sharp editorial edges. Don't sneak in `rounded-md` defaults from shadcn.
- Use OKLCH or HSL in CSS variables to make derivative computations (e.g. text-on-bg auto-derive) trivial.

## Definition of Done
Per Appendix C; design tokens documented in `docs/design-system.md`.
