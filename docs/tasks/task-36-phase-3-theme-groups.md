# Task 36 — Phase 3: THEME Tab Groups & Live Contrast Feedback

**Objective:** Redesign THEME tab from flat list to 3 grouped sections with real-time WCAG feedback.

**Files to modify:**
- `components/editor/ThemeTab.tsx`

**Estimated effort:** 4–5 hours

---

## Overview

Replace the current THEME tab with a structured 3-group layout:
1. **COLORS** — background + accent swatches with live contrast feedback
2. **FONTS** — 8 font pair cards in 2-column grid
3. **LAYOUT** — hero style + gallery layout pickers (thumbnail cards)

---

## Tasks

### 1. COLORS Group

#### Background Swatches
- [ ] Label: "BACKGROUND" (11px, uppercase, `text-muted`)
- [ ] Display 6 swatches in a row
- [ ] Swatch specs:
  - [ ] Size: 32×32px
  - [ ] Border-radius: `rounded`
  - [ ] Border: 1px (default), 2px white ring when selected
  - [ ] Hover: `scale(1.05)`
  - [ ] Margin-bottom: 8px (label to swatches)
- [ ] Labels below each swatch (10px, `text-muted`): "Night", "Coal", "Purple", etc.
- [ ] Custom hex input:
  - [ ] 36px wide pill
  - [ ] Appears after 6 swatches (or below if no space)
  - [ ] Input: 12px, `text-text`
  - [ ] Validation on blur
- [ ] On selection: `applyMutation('theme', { bgColor: newColor })`

#### Accent Swatches
- [ ] Label: "ACCENT" (11px, uppercase, `text-muted`)
- [ ] Display 12 swatches in 6×2 grid
- [ ] Same size and selected state as background
- [ ] Margin-bottom: 12px (to contrast feedback)
- [ ] On selection: `applyMutation('theme', { accentColor: newColor })`
- [ ] **Live contrast feedback (appears immediately after accent grid):**
  ```
  ✓ "AA contrast passed" (green text) OR
  ✕ "Contrast too low (2.8:1) — pick lighter or darker" (red text)
  ```
  - [ ] Font: 11px
  - [ ] Color: `text-accent` for pass, `text-red-500` for fail
  - [ ] Update instantly (no publish gate)
  - [ ] Use `lib/design/validate-theme-contrast.ts` for calculation

#### Divider
- [ ] 1px solid `border-border`
- [ ] Margin: `my-3`

---

### 2. FONTS Group

#### Label
- [ ] "FONTS" (11px, uppercase, `text-muted`)
- [ ] Margin-bottom: 10px

#### Font Pair Cards
- [ ] Grid: 2 columns
- [ ] Card height: 72px
- [ ] Card background: `bg-surface`
- [ ] Card border: `border border-border`
- [ ] Card padding: `p-2.5` (10px)
- [ ] Card radius: `rounded`
- [ ] **Top line** (70% height):
  - [ ] Text: "HEADLINE" (rendered in preset's display font)
  - [ ] Font-size: 18px
  - [ ] Font: actual display font from font pair
  - [ ] Vertical align: center
- [ ] **Bottom line** (30% height):
  - [ ] Text: "Body text sample"
  - [ ] Font-size: 11px
  - [ ] Font: actual body font from font pair
  - [ ] Vertical align: center
- [ ] **Bottom tag:**
  - [ ] Pair name (10px, `text-muted`)
  - [ ] Margin-top: 2px
- [ ] **Selected state:**
  - [ ] Border: 1.5px `accent`
  - [ ] Background: `bg-accent` at 5% opacity
- [ ] **Hover state:**
  - [ ] Border-color: `accent` at 40% opacity
- [ ] On selection: `applyMutation('theme', { fontPairId: newId })`

---

### 3. LAYOUT Group

#### Hero Style
- [ ] Label: "Hero Style" (11px, `text-muted`)
- [ ] Margin-bottom: 8px
- [ ] 3 cards in a row (equal width, ~80px each)
- [ ] Card height: 52px
- [ ] Card background: `bg-surface`
- [ ] Card border: `border border-border`
- [ ] Card radius: `rounded`
- [ ] **Content:** minimal SVG wireframe
  - [ ] Two rectangles representing layout zones
  - [ ] Height: 40px (fits in 52px card with padding)
- [ ] **Label below card** (11px, `text-muted`):
  - [ ] "Full Bleed" / "Split" / "Centered"
  - [ ] Center-aligned
  - [ ] Margin-top: 4px
- [ ] **Selected state:**
  - [ ] Border: 1px `accent`
  - [ ] Label color: `text-accent`
- [ ] On selection: `applyMutation('theme', { heroStyle: newValue })`

#### Gallery Layout
- [ ] Same pattern as Hero Style
- [ ] Label: "Gallery Layout" (11px, `text-muted`)
- [ ] Margin-top: 16px (above gallery section)
- [ ] 3 cards: "Mosaic" / "Grid" / "Carousel"
- [ ] Card wireframes:
  - [ ] Mosaic: asymmetric 3-box layout
  - [ ] Grid: 3×2 equal boxes (6 boxes total)
  - [ ] Carousel: single wide rectangle with arrow hints
- [ ] On selection: `applyMutation('theme', { galleryLayout: newValue })`

---

## Implementation Notes

### Group Structure (CSS)
```tsx
<div className="space-y-6">
  {/* COLORS */}
  <div>
    <h3 className="text-xs uppercase text-muted mb-3">Colors</h3>
    {/* Background swatches */}
    {/* Accent swatches */}
    {/* Live contrast feedback */}
  </div>
  
  {/* FONTS */}
  <div>
    <h3 className="text-xs uppercase text-muted mb-3">Fonts</h3>
    {/* 2-column grid */}
  </div>
  
  {/* LAYOUT */}
  <div>
    <h3 className="text-xs uppercase text-muted mb-3">Layout</h3>
    {/* Hero style cards */}
    {/* Gallery layout cards */}
  </div>
</div>
```

### Live Contrast Feedback
- [ ] Hook into `validate-theme-contrast.ts` function
- [ ] Calculate WCAG AA ratio on accent color change
- [ ] Display result immediately (synchronous)
- [ ] Show pass/fail with percentage ratio
- [ ] Example:
  ```
  ✓ AA contrast passed
  ✕ Contrast too low (2.8:1) — pick lighter or darker
  ```

### Color Swatch Selection
- [ ] Use `cn()` utility for selected state
- [ ] Show white ring (outline-offset) for selected
- [ ] Smooth scale on hover

### Font Preview Rendering
- [ ] Font pair object: `{ displayFont, bodyFont, name }`
- [ ] Top line: uses display font from `--font-display` CSS var
- [ ] Bottom line: uses body font from `--font-body` CSS var
- [ ] Fonts auto-load via globals.css (already in place)

---

## Verification Checklist

- [ ] COLORS group displays background and accent swatches
- [ ] Contrast feedback appears instantly on accent selection
- [ ] Feedback is accurate (use WCAG algorithm)
- [ ] FONTS group shows all font pairs
- [ ] Font cards render actual fonts (display + body visible)
- [ ] Selected state clearly visible (border + bg)
- [ ] LAYOUT group shows hero style cards
- [ ] LAYOUT group shows gallery layout cards
- [ ] Thumbnail SVGs render correctly
- [ ] All selections persist via `applyMutation()`
- [ ] Preview updates instantly on color/font/layout change
- [ ] No console errors
- [ ] Spacing matches spec exactly

---

## Testing

```bash
# E2E: Theme interactions
npm run test:e2e editor-theme.spec.ts

# Manual: Color selection
npm run dev
# 1. Click different accent swatches
# 2. Verify contrast feedback updates instantly
# 3. Try combinations that pass/fail AA

# Manual: Font selection
# 1. Click different font pair cards
# 2. Verify preview updates with new fonts
# 3. Verify top/bottom text render in correct fonts

# Manual: Layout selection
# 1. Click hero style cards
# 2. Click gallery layout cards
# 3. Verify preview reflects layout change

# Color reproduction test
# 1. Verify accent swatch colors match spec hex values
# 2. Verify background swatches match preset colors
```

---

## Sign-Off

When all tasks complete:

- [ ] All three groups functional
- [ ] Contrast feedback real-time and accurate
- [ ] Font cards display actual fonts
- [ ] Layout pickers work correctly
- [ ] Preview updates instantly
- [ ] All E2E tests pass
- [ ] No regressions
- [ ] Ready for Phase 4

**PR:** [link]  
**Merged:** [date]
