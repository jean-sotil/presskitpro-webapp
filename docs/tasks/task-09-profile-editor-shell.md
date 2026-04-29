# Task 09 — Profile Editor Shell (Two-Pane + Autosave + Publish)

## Summary
Build the editor frame: left form pane, right live preview, autosave, dirty-state indicator, manual Publish, mobile tab fallback.

## PRD references
- §6.3 (Profile editor), §2 goal #1 (TTPP < 10 min).

## Dependencies
- task-05, task-08, task-03.

## Scope (in)
- `/dashboard/profile/{id}` two-pane layout; pane is collapsed to tabs at <1024px.
- Live preview pane renders the public profile component using draft data (server-render once, then client-hydrate diffs via TanStack Query).
- Autosave on 5s of inactivity; visual "Saved · 12s ago" indicator.
- Publish/Unpublish button with confirmation modal; publish triggers ISR revalidation (task-19).
- Section reorder via drag-and-drop; order persisted on the `Themes.sectionOrder` field.
- Per-section nav rail on the left edge.

## Scope (out)
- Theme tab — separate task-18.
- Each section's internal UI — tasks 10–17.

## Acceptance criteria
- [ ] Edits reflect in the preview within 200ms.
- [ ] Closing the tab mid-edit does not lose unsaved data (autosave fires on `visibilitychange`).
- [ ] Publishing an unpublished profile makes it reachable at `presskit.pro/{slug}` within 5s.
- [ ] Drag-reordering sections updates `sectionOrder` and the preview without a full reload.
- [ ] Mobile tab fallback is keyboard-navigable.

## Implementation notes
- Preview pane uses the same RSC tree as the public page, behind a draft flag — guarantees parity.
- Use TanStack Query's `setQueryData` for optimistic preview updates; mutation rolls back on save error.
- Persist last-edited timestamp; show "X changed Y minutes ago" for resume context.

## Definition of Done
Per Appendix C.
