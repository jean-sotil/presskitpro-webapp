# Task 36 — Phase 1: Panel Shell Restructuring

**Objective:** Refactor EditorClient layout to support sticky top/bottom bars with scrollable middle content.

**Files to modify:**
- `app/dashboard/profile/[id]/EditorClient.tsx`

**Estimated effort:** 2–3 hours

---

## Layout Structure

Replace the current flat layout with a 3-tier sticky system:

```
┌──────────────────────────────────────┐
│ STICKY TOP BAR (48px)                │  ← slug + status + publish
├──────────────────────────────────────┤
│ STICKY TAB STRIP (40px)              │  ← SECTIONS | THEME | PRESETS
├──────────────────────────────────────┤
│                                      │
│ SCROLLABLE CONTENT (flex-1)          │  ← EditCard or ThemeTab or DesignTab
│ overflow-y-auto                      │
│                                      │
├──────────────────────────────────────┤
│ STICKY BOTTOM BAR (64px)             │  ← auto-save status + Preview toggle
└──────────────────────────────────────┘
```

---

## Tasks

### 1. Top Bar (48px, sticky)
- [ ] Background: `bg-surface`
- [ ] Border-bottom: `border-border`
- [ ] Padding: `py-4 px-6 md:px-12`
- [ ] Flex layout: `flex items-center justify-between`
- **Left side:**
  - [ ] Back arrow + "Dashboard" text (12px, `text-muted`)
  - [ ] Separator: " / "
  - [ ] Profile slug (12px, `text-text`, 500 weight)
- **Right side:**
  - [ ] Status pill (Draft/Published/Unsaved)
  - [ ] Publish button (moved from bottom, orange fill)

### 2. Tab Strip (40px, sticky, below top bar)
- [ ] Position: `sticky top-[48px]` (below header)
- [ ] Height: `h-10` (40px)
- [ ] Background: `bg-bg`
- [ ] Border-bottom: `border-border`
- [ ] Flex layout: 3 equal tabs
- **Each tab:**
  - [ ] Font: `uppercase text-xs tracking-wider`
  - [ ] Inactive: `text-text-muted`, no border
  - [ ] Active: `text-accent`, `border-b-2 border-accent`
  - [ ] Padding: `px-3 py-2`
  - [ ] Tab names: SECTIONS, THEME, PRESETS

### 3. Scrollable Content Area
- [ ] Flex-column wrapper with `flex-1`
- [ ] Overflow: `overflow-y-auto`
- [ ] Padding: varies by tab (0 for accordion, 12px for others)
- [ ] Contains one of:
  - [ ] BlocksTab (when `editorTab === 'sections'`)
  - [ ] ThemeTab (when `editorTab === 'theme'`)
  - [ ] DesignTab (when `editorTab === 'design'`)

### 4. Bottom Bar (64px, sticky)
- [ ] Position: `sticky bottom-0`
- [ ] Height: `h-16` (64px)
- [ ] Background: `bg-surface`
- [ ] Border-top: `border-border`
- [ ] Padding: `px-4 py-3 md:px-6`
- [ ] Flex layout: `flex items-center justify-between`
- **Left side:**
  - [ ] Auto-save status text (12px, `text-muted`)
  - [ ] States: "Saving…" | "Saved Xs ago" | "Save failed – retry"
  - [ ] Use existing `SaveStatus` component
- **Right side:**
  - [ ] Preview toggle button
  - [ ] Text: `◀ Preview` (when editor visible) / `Editor ▶` (when preview visible)
  - [ ] Style: ghost button, 12px, `text-text-muted`
  - [ ] Function: toggles `MobileTabs` pane on mobile

---

## Implementation Notes

### Grid Layout Protection
```tsx
<div className="hidden md:grid md:grid-cols-[24rem_1fr] md:gap-8 md:px-12 md:py-8">
  {editPaneEl}  {/* flex-col with sticky bars inside */}
  {previewPaneEl}  {/* unchanged */}
</div>
```

**DO NOT CHANGE** `grid-cols-[24rem_1fr]` — this protects preview pane width.

### Edit Pane Structure
```tsx
<div className="flex flex-col h-screen md:h-full">
  {/* Top bar */}
  <header className="sticky top-0 z-10">...</header>
  
  {/* Tab strip */}
  <div role="tablist" className="sticky top-[48px] z-10">...</div>
  
  {/* Scrollable content */}
  <div className="flex-1 overflow-y-auto">
    {editorTab === 'sections' ? <BlocksTab /> : ...}
  </div>
  
  {/* Bottom bar */}
  <div className="sticky bottom-0 z-10">...</div>
</div>
```

### Z-index Notes
- Top bar: `z-10`
- Tab strip: `z-10` (floats above content)
- Bottom bar: `z-10` (floats above content)
- Use z-index to ensure bars stay on top during scroll

---

## Verification Checklist

- [ ] Top bar displays slug + status + publish button
- [ ] Tab strip stays visible when scrolling sections
- [ ] Content area scrolls independently
- [ ] Bottom bar stays visible; doesn't obstruct content
- [ ] Preview pane right column still receives full height
- [ ] Grid layout remains `[24rem_1fr]` (no preview squeeze)
- [ ] All mutations still trigger preview updates
- [ ] Mobile: MobileTabs still works (edit/preview toggle)
- [ ] No console errors

---

## Testing

```bash
# Visual inspection
npm run dev
# Open http://localhost:3000/dashboard/profile/[any-id]
# Scroll sections, verify bars stay sticky
# Edit a field, verify preview updates instantly

# E2E tests
npm run test:e2e editor.spec.ts

# Type check
npm run type-check
```

---

## Sign-Off

When all tasks complete:

- [ ] Layout structure matches spec
- [ ] Sticky positioning works (no jank)
- [ ] Grid layout verified unchanged
- [ ] All E2E tests pass
- [ ] No regressions in existing functionality
- [ ] Ready for Phase 2

**PR:** [link]  
**Merged:** [date]
