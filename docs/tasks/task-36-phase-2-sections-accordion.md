# Task 36 — Phase 2: SECTIONS Tab Accordion Redesign

**Objective:** Replace flat section list with Meshy-style accordion cards.

**Files to modify:**
- `components/editor/BlocksTab.tsx` (✅ already created, needs integration)
- `components/editor/EditorPane.tsx`
- `app/dashboard/profile/[id]/EditorClient.tsx`

**Estimated effort:** 3–4 hours

---

## Overview

Convert the section list from a sidebar rail into accordion cards inside the scrollable content area. One section open at a time, with smooth max-height animations.

---

## Tasks

### 1. BlocksTab Integration

- [ ] Import BlocksTab in EditorClient
- [ ] Render when `editorTab === 'sections'`:
  ```tsx
  {editorTab === 'sections' ? (
    <BlocksTab
      active={active}
      order={sectionOrder}
      bundle={bundle}
      onSelect={setActive}
      onReorder={(next) => {
        applyMutation('theme', {
          sectionOrder: next.map((key) => ({ key })),
        });
      }}
      onMutate={applyMutation}
    />
  ) : null}
  ```
- [ ] Remove SectionRail import (no longer used)
- [ ] Remove SectionRail from render (replaced by BlocksTab)

### 2. BlocksTab Card Styling

- [ ] Container: `flex flex-col gap-2 px-3 pb-4`
- [ ] Each card:
  - [ ] Background: `bg-surface`
  - [ ] Border: `border border-border`
  - [ ] Border radius: `rounded-lg`
  - [ ] Overflow: `overflow-hidden`
  - [ ] Transition: `transition-all`
- [ ] Open state: add `border-l-2 border-l-accent`
- [ ] Dragged state: `opacity-60`

### 3. BlocksTab Header (44px)

- [ ] Height: `h-11` (44px)
- [ ] Padding: `px-3.5`
- [ ] Flex layout: `flex items-center justify-between`
- [ ] Cursor: `cursor-pointer`
- [ ] Hover: `hover:bg-border`
- [ ] Transition: `transition-colors`
- **Label text:**
  - [ ] Font: 13px, 500 weight
  - [ ] Inactive: `text-text`
  - [ ] Active (open): `text-accent`
- **Icons (right side):**
  - [ ] Chevron (14px, `text-text-muted`)
    - [ ] Rotate 0° when closed
    - [ ] Rotate 180° when open
    - [ ] Transition: 140ms ease
  - [ ] Drag handle (grip icon)
    - [ ] Hidden by default, opacity-0
    - [ ] Appears on group-hover, opacity-100
    - [ ] Transition: smooth opacity

### 4. BlocksTab Content Area (when open)

- [ ] Border-top: `border-t border-border`
- [ ] Padding: `px-3.5 py-4`
- [ ] Render section's EditCard here
- [ ] Animation: max-height 200ms ease (smooth accordion)
- [ ] Guard with `prefers-reduced-motion`

### 5. Section Content Rendering

- [ ] Update EditorPane to work in accordion mode
- [ ] When section is active in BlocksTab:
  - [ ] Render section's EditCard inside open card content
  - [ ] Pass `onMutate` callback to EditCard
  - [ ] Pass bundle and section key
- [ ] All existing EditCard logic unchanged

### 6. Drag-Reorder

- [ ] BlocksTab already implements drag/drop handlers
- [ ] Drag events:
  - [ ] `onDragStart`: set `draggedKey`
  - [ ] `onDragOver`: `preventDefault()`
  - [ ] `onDrop`: reorder array, call `onReorder()`
- [ ] Visual feedback:
  - [ ] Dragged card: opacity-60
  - [ ] Drop target: subtle highlight (handled by card hover)

---

## Component Alignment

**Verify BlocksTab.tsx uses design system:**

- [ ] Colors: `bg-surface`, `text-accent`, `border-border` (no hardcoded hex)
- [ ] Uses `cn()` utility for conditional classes
- [ ] SVG icons use `stroke="currentColor"` (inherits from `text-text-muted`)
- [ ] No inline `style={}` objects
- [ ] Font: display font for labels (via Tailwind)

---

## Integration Checklist

### EditorPane.tsx Changes
- [ ] Remove `SectionRail` import
- [ ] Remove `SectionRail` render
- [ ] Accept accordion-aware props from parent
- [ ] When section is active: render EditCard
- [ ] Pass `onMutate` to EditCard

### EditorClient.tsx Changes
- [ ] Import BlocksTab
- [ ] In scrollable content area:
  - [ ] Show BlocksTab when `editorTab === 'sections'`
  - [ ] Hide SectionRail
- [ ] Maintain `active` state (currently `setActive`)
- [ ] Maintain `sectionOrder` state
- [ ] Wire up `onReorder` callback

### Spacing (per spec)
- [ ] Card margin-bottom: 8px
- [ ] Card padding inside: 14px (sides + bottom)
- [ ] Header height: 44px
- [ ] Icon gap: 8px (between chevron and drag handle)

---

## Verification Checklist

- [ ] One section open at a time (no multi-select)
- [ ] Clicking header toggles open/close
- [ ] Chevron rotates smoothly (140ms)
- [ ] Open state shows orange left border + orange text
- [ ] Closed state shows white text, transparent border
- [ ] Drag handle appears on card hover
- [ ] Drag-reorder works, persists via `applyMutation()`
- [ ] Active section shows EditCard (not blank)
- [ ] Tab switching preserves section state
- [ ] All EditCard functionality works (uploads, mutations, etc.)
- [ ] Preview updates instantly on field edits
- [ ] Animations respect `prefers-reduced-motion`
- [ ] No console errors

---

## Testing

```bash
# E2E: Section interactions
npm run test:e2e editor.spec.ts
npm run test:e2e editor-hero.spec.ts

# Manual: Accordion behavior
npm run dev
# 1. Click section headers, verify open/close
# 2. Drag section headers, verify reorder persists
# 3. Edit field in open section, verify preview updates
# 4. Switch to THEME tab and back, verify section state preserved

# Mobile testing
# 1. Open on mobile, verify accordion works on touch
# 2. Verify drag-reorder has 200ms delay (doesn't interfere with tap)
```

---

## Sign-Off

When all tasks complete:

- [ ] Accordion fully functional
- [ ] All EditCards work correctly
- [ ] Drag-reorder persists
- [ ] Preview updates flow through
- [ ] No regressions in existing features
- [ ] All E2E tests pass
- [ ] Ready for Phase 3

**PR:** [link]  
**Merged:** [date]
