# Task 36 — Phase 4: PRESETS Tab Grid & Polish

**Objective:** Redesign PRESETS tab with visual grid cards, then polish all phases and prepare for deployment.

**Files to modify:**
- `app/dashboard/profile/[id]/DesignTab.tsx` (rename/refactor to PresetsTab)
- All components from phases 1–3 (polish passes)

**Estimated effort:** 5–6 hours (3–4h presets, 2–3h polish)

---

## PRESETS Tab Redesign

### Grid Layout

- [ ] 2-column grid, full width
- [ ] Card dimensions: 100px tall total
  - [ ] Top area: 70px (preview SVG)
  - [ ] Bottom area: 30px (preset name)
- [ ] Card border: 1px `border-border`
- [ ] Card radius: `rounded-lg`
- [ ] Overflow: `overflow-hidden` (rounds SVG inside)
- [ ] Margin-bottom: 12px between rows
- [ ] Gap: 12px between columns

### Mini Preview SVG (70px area)

- [ ] SVG fills entire area (70px tall, full width)
- [ ] Content:
  - [ ] Background fill: preset's background color
  - [ ] Accent stripe: 8px tall horizontal stripe, preset's accent color
  - [ ] Font label: preset name (12px, using preset's display font)
  - [ ] Vertically centered in remaining space
- [ ] No padding, crisp edges
- [ ] Aspect ratio: auto (full width)

### Preset Name Label (30px area)

- [ ] Background: `bg-surface`
- [ ] Text: preset name (Manrope 12px, 500 weight, `text-text`)
- [ ] Padding: `py-2 px-2` (8px)
- [ ] Vertical align: center
- [ ] Horizontal align: center
- [ ] Ellipsis if name overflows (max 1 line)

### Card States

- [ ] **Default:**
  - [ ] Border: 1px `border-border`
  - [ ] Hover: slight scale(1.02), smooth transition
  - [ ] Cursor: `cursor-pointer`
- [ ] **Selected:**
  - [ ] Border: 1.5px `accent` (or `border-2`)
  - [ ] Background: unchanged
  - [ ] Label: `text-accent` (optional, text-accent is enough)
- [ ] **Interaction:**
  - [ ] Click → apply preset via `applyMutation('theme', { presetId })`
  - [ ] No confirmation needed

### Populate Presets

- [ ] Query codebase for existing presets
- [ ] Discover preset data structure (colors, fonts, layout)
- [ ] Display ALL presets found (no invention)
- [ ] Match preset names exactly as they appear in code
- [ ] Generate mini SVG preview for each preset

### Reset Link

- [ ] Location: bottom of tab, left-aligned
- [ ] Text: "Reset to default preset" (12px, `text-muted`, `underline`)
- [ ] Margin-top: 16px (above link)
- [ ] Click → show inline confirmation:
  ```
  "This will overwrite your current theme. Confirm?"
  [Yes, reset] [Cancel]
  ```
- [ ] Buttons:
  - [ ] Yes: ghost button, danger variant, 12px
  - [ ] Cancel: link style, 12px
- [ ] On confirm: `applyMutation('theme', { presetId: null })`
- [ ] On cancel: dismiss confirmation, stay on tab

---

## Polish Phase

### 1. Spacing Audit (all components)

- [ ] Panel outer padding (horizontal): 12px
- [ ] Section card margin-bottom: 8px
- [ ] Section card inner padding: 14px (sides + bottom, 0 top)
- [ ] Field label → input gap: 6px
- [ ] Field → field gap: 12px
- [ ] Group block padding: 14px
- [ ] Group header margin-bottom: 10px
- [ ] Tab strip height: 40px
- [ ] Top bar height: 48px
- [ ] Bottom bar height: 64px
- [ ] Font sizes match spec: 13px labels, 12px secondary, 11px captions

### 2. Animation & Motion Audit

- [ ] Chevron rotation: 140ms ease (motion-quick)
- [ ] Max-height accordion: 200ms ease (not in spec, but good)
- [ ] Font card selection: smooth `transition-colors` (140ms)
- [ ] Swatch hover scale: smooth (140ms)
- [ ] Bottom bar fade: smooth (140ms)
- [ ] All animations guard with `prefers-reduced-motion`
  ```css
  @media (prefers-reduced-motion: reduce) {
    * { animation-duration: 0.01ms !important; }
  }
  ```

### 3. Color System Audit

- [ ] No hardcoded hex colors in components
- [ ] All colors use Tailwind tokens:
  - [ ] `text-accent` (not `#ff6b00`)
  - [ ] `bg-surface` (not `#141414`)
  - [ ] `border-border` (not `#1f1f1f`)
  - [ ] `text-text-muted` (not `#7a7670`)
- [ ] SVG icons: `stroke="currentColor"` (inherits from parent)
- [ ] CSS var system working (light/dark mode adaptive)

### 4. Visual Polish

- [ ] Icon alignment: all icons 14–16px, centered
- [ ] Text hierarchy: body text consistently 13px, labels 11px
- [ ] Button consistency: all CTAs use same styling
- [ ] Border consistency: all borders 1px (or 2px when emphasized)
- [ ] Hover states: all interactive elements have hover feedback
- [ ] Focus states: all inputs show orange focus ring
- [ ] Empty states: no blank placeholders (but OK for placeholder text)

### 5. Mobile Responsiveness

- [ ] MobileTabs still works (edit/preview toggle)
- [ ] Accordion cards usable on small screens
- [ ] Font pair cards stack if needed (2-col → 1-col)
- [ ] Swatch grids shrink proportionally
- [ ] No horizontal scroll
- [ ] Touch interactions work:
  - [ ] Tap to toggle section: 200ms delay (dnd-kit default)
  - [ ] Drag-reorder: works with touch sensor
  - [ ] Swatch selection: responsive to touch

### 6. Browser Testing

- [ ] Chrome (latest) — desktop & mobile
- [ ] Safari (latest) — desktop & mobile (iPad)
- [ ] Firefox (latest) — desktop
- [ ] iOS Safari (actual device if possible)
- [ ] Test on throttled device (Chrome DevTools)

### 7. E2E Test Coverage

- [ ] Update `editor.spec.ts`:
  - [ ] Tab navigation (sections, theme, presets)
  - [ ] Basic section flow
- [ ] Update `editor-hero.spec.ts`:
  - [ ] Section card accordion
  - [ ] Field edits in open section
  - [ ] Preview updates
- [ ] Update `editor-theme.spec.ts`:
  - [ ] Swatch selection
  - [ ] Contrast feedback calculation
  - [ ] Font pair selection
  - [ ] Layout picker interaction
- [ ] Update `editor-design.spec.ts` (or create if needed):
  - [ ] Preset card selection
  - [ ] Reset confirmation flow
  - [ ] Preview updates with preset

### 8. Regression Testing

- [ ] Autosave: fires on edit, displays status correctly
  - [ ] "Saving…" appears during fetch
  - [ ] "Saved Xs ago" updates every second
  - [ ] "Save failed – retry" on error
- [ ] Publish button: state reflects changes
  - [ ] Draft → orange fill when changes
  - [ ] Unsaved → orange fill
  - [ ] Published → gray (disabled) when up-to-date
- [ ] Preview pane:
  - [ ] Updates instantly on every edit
  - [ ] No lag, no delayed renders
  - [ ] Shows live profile with edits
- [ ] Tab switching:
  - [ ] SECTIONS → THEME → PRESETS → SECTIONS
  - [ ] No state loss
  - [ ] Active section preserved
- [ ] Existing EditCard functionality:
  - [ ] HeroEditCard: uploads, CTA, tagline
  - [ ] AboutEditCard: bio text, locale
  - [ ] ServicesEditCard: add/remove services
  - [ ] All others still work

### 9. Accessibility Audit

- [ ] Focus management: tab navigation works
- [ ] ARIA labels: all interactive elements labeled
- [ ] Color contrast: all text passes WCAG AA
- [ ] Keyboard nav: can access all controls via Tab
- [ ] Screen reader: sections announced correctly
- [ ] Reduced motion: animations respect preference
- [ ] Icons have `aria-label` or are `aria-hidden`

### 10. Performance Audit

- [ ] No console warnings/errors
- [ ] Page load: < 3s (target)
- [ ] Tab switch: instant (< 100ms render)
- [ ] Field edit: instant (< 50ms re-render via React Query)
- [ ] Preview update: instant (< 100ms sync)
- [ ] No memory leaks (DevTools heap snapshot before/after)
- [ ] No re-render cascades (React Profiler)

---

## Final Checklist

### Code Quality
- [ ] TypeScript: `npm run type-check` passes
- [ ] Linting: `npm run lint` passes
- [ ] No TODO comments (or documented with issue #)
- [ ] No `console.log` or debug code
- [ ] Imports organized (absolute first, then relative)

### Documentation
- [ ] Updated comments in complex sections
- [ ] Spec compliance documented (if non-obvious)
- [ ] PR description explains changes
- [ ] No breaking changes (all backward compatible)

### Testing
- [ ] All E2E tests pass: `npm run test:e2e`
- [ ] No flaky tests
- [ ] Unit tests (if added) pass
- [ ] Manual testing checklist complete

### Deployment Readiness
- [ ] No console errors in production build
- [ ] All features work in deployed environment
- [ ] Staging tested before production merge
- [ ] Rollback plan documented (if needed)

---

## Testing Procedure

```bash
# 1. Type check
npm run type-check

# 2. Linting
npm run lint

# 3. E2E tests
npm run test:e2e

# 4. Dev server (visual inspection)
npm run dev
# Open http://localhost:3000/dashboard/profile/[id]
# Walk through all phases:
#   - Panel shell: top/bottom sticky
#   - Sections: accordion, drag-reorder
#   - Theme: swatches, contrast feedback, fonts, layout
#   - Presets: grid, mini preview, reset
# Test preview updates on every edit
# Test mobile (DevTools responsive mode)

# 5. Production build
npm run build
npm run start  # or deploy to staging
```

---

## Sign-Off

When all tasks complete:

- [ ] PRESETS tab fully functional
- [ ] All 4 phases complete
- [ ] Spacing matches spec exactly
- [ ] All animations smooth and correct
- [ ] Colors use design system (no hardcoded hex)
- [ ] Preview pane unaffected, updates instantly
- [ ] Mobile experience unchanged
- [ ] All E2E tests pass (no regressions)
- [ ] Accessibility audit passed
- [ ] Performance audit passed
- [ ] Zero console errors

**Ready for deployment:** ✅

**PR:** [link]  
**Merged:** [date]  
**Deployed:** [date]
