# Task 36: Editor Panel Redesign — Complete Overview

**Status:** Ready for implementation  
**Preview safety:** ✅ Confirmed (grid layout `[24rem_1fr]` unchanged)  
**Total effort:** 14–18 hours (4 phases)

---

## Files Reference

| File | Purpose |
|------|---------|
| `task-36-editor-panel-redesign.md` | Complete design spec v2.0 with all visual details |
| `task-36-phase-1-panel-shell.md` | Phase 1: Layout infrastructure (sticky bars) |
| `task-36-phase-2-sections-accordion.md` | Phase 2: SECTIONS tab accordion redesign |
| `task-36-phase-3-theme-groups.md` | Phase 3: THEME tab groups + contrast feedback |
| `task-36-phase-4-presets-polish.md` | Phase 4: PRESETS tab grid + full polish & testing |

---

## 4-Phase Implementation Plan

### Phase 1: Panel Shell Restructuring (2–3h)
**File:** `task-36-phase-1-panel-shell.md`

Refactor EditorClient layout to support sticky top/bottom bars:
- Top bar (48px): slug + status + publish
- Tab strip (40px): SECTIONS | THEME | PRESETS
- Scrollable content (flex-1): accordion or tab content
- Bottom bar (64px): auto-save status + preview toggle

**Key:** Grid layout stays `[24rem_1fr]` — preview pane protected

---

### Phase 2: SECTIONS Tab Accordion (3–4h)
**File:** `task-36-phase-2-sections-accordion.md`

Replace flat section list with Meshy-style accordion cards:
- One section open at a time
- Card header (44px): label + chevron + drag handle
- Open state: orange left border + orange label text
- Drag-reorder: persists via `applyMutation()`
- Content area: renders active section's EditCard

---

### Phase 3: THEME Tab Groups (4–5h)
**File:** `task-36-phase-3-theme-groups.md`

Redesign THEME tab into 3 non-accordion groups:
- **COLORS:** 6 background swatches + 12 accent swatches (6×2 grid) + live WCAG contrast feedback
- **FONTS:** 8 font pair cards (2-column grid) with actual rendered text
- **LAYOUT:** Hero style (3 cards) + gallery layout (3 cards) with SVG wireframes

---

### Phase 4: PRESETS Tab + Polish (5–6h)
**File:** `task-36-phase-4-presets-polish.md`

Complete PRESETS tab and polish all phases:
- **PRESETS:** 2-column grid of 100px preset cards (70px SVG preview + 30px name label)
- **Reset link:** with inline confirmation
- **Polish:** spacing, animations, color audit, mobile testing, E2E coverage, accessibility, performance

---

## Key Constraints (Protect Preview Pane)

✅ **Grid layout unchanged:** `grid-cols-[24rem_1fr]`  
✅ **Bundle flow intact:** all mutations use `applyMutation()` → React Query cache  
✅ **No direct prop drilling:** PreviewPane receives bundle from cache, updates automatically  
✅ **No layout squeeze:** left pane stays ~24rem, preview gets full remaining width  

---

## Design System Alignment

**Always use Tailwind tokens, NOT hardcoded hex:**

```tsx
// ✅ Correct
className="bg-surface border-border text-accent"

// ❌ Wrong
style={{ background: '#141414', borderColor: '#ff6b00' }}
```

Token mapping (from globals.css):
- `bg` → `#0a0a0a`
- `surface` → `#141414`
- `border` → `#1f1f1f`
- `text` → `#f0ede6`
- `text-muted` → `#7a7670`
- `accent` → `#ff6b00`

---

## Component Status

| Component | Status | Notes |
|-----------|--------|-------|
| BlocksTab.tsx | ✅ Created | Already aligned with design system, ready to integrate |
| EditorClient.tsx | 📝 Modify | Add sticky layout (Phase 1) |
| ThemeTab.tsx | 📝 Redesign | 3-group layout + contrast feedback (Phase 3) |
| DesignTab.tsx | 📝 Redesign | Preset grid cards (Phase 4) |

---

## Testing Checklist (all phases)

- [ ] Preview pane updates instantly on every edit
- [ ] Tab switching preserves state
- [ ] Mutations flow through `applyMutation()` correctly
- [ ] Autosave fires and displays status
- [ ] Publish button reflects changes
- [ ] Mobile experience unchanged (MobileTabs works)
- [ ] All E2E tests pass
- [ ] No console errors or warnings
- [ ] Accessibility audit passed
- [ ] Performance: tab switch < 100ms, field edit < 50ms

---

## Success Criteria

When all 4 phases complete:

✅ Left panel layout matches spec visually  
✅ Accordion sections work (one open, drag-reorderable)  
✅ Theme groups display colors, fonts, layouts with live feedback  
✅ Presets grid shows all presets with visual previews  
✅ Preview pane updates instantly, unaffected by redesign  
✅ Grid layout unchanged (`[24rem_1fr]`)  
✅ All animations smooth, respect `prefers-reduced-motion`  
✅ Colors use design system (Tailwind tokens)  
✅ All E2E tests pass, no regressions  
✅ Zero color palette changes, zero feature scope changes  
✅ Ready for production deployment  

---

## Getting Started

1. Read `task-36-editor-panel-redesign.md` (visual reference)
2. Follow Phase 1 checklist in `task-36-phase-1-panel-shell.md`
3. After Phase 1 sign-off, move to Phase 2
4. Continue sequentially (phases are dependent)
5. After Phase 4, you're done!

---

## Questions?

- **Preview pane safety:** See "Key Constraints" section above
- **Design system colors:** See globals.css or task-36-quick-reference.md
- **Component structure:** Each phase file has detailed breakdown
- **Testing approach:** See testing checklist in each phase file
