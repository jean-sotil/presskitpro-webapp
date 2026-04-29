# Task 12 — Editor Section: Photo Gallery

## Summary
Drag-and-drop photo upload, manual reordering, mandatory alt text or explicit "decorative" mark.

## PRD references
- §6.3 (Photo gallery), §11 (a11y — alt text gate), §12.2 (gallery layout selector lives in Theme tab).

## Dependencies
- task-09, task-08.

## Scope (in)
- Drag-drop upload zone; multi-file accepted.
- Client-side resize to max 2400px long edge; AVIF preferred, JPEG fallback.
- Reorder by drag; order persisted.
- Per-image alt-text field; save blocked on empty unless user explicitly toggles "Decorative".
- Soft cap of 24 photos per profile; hard cap of 50.
- Bulk delete with confirmation.

## Scope (out)
- Cropping/editing tools (out of scope for v1).
- Video uploads.

## Acceptance criteria
- [ ] Uploading 10 photos at once shows accurate per-file progress.
- [ ] An image flagged "Decorative" renders with `alt=""` (correct WCAG behavior).
- [ ] Save is blocked with a clear list of which images are missing alt text.
- [ ] Reorder persists across browser refresh.

## Implementation notes
- Storage bucket `gallery` (per §7 storage section).
- Use the Supabase Storage transformation API to deliver responsive `srcset` variants.
- Drag-reorder: `dnd-kit` recommended for keyboard accessibility out of the box.

## Definition of Done
Per Appendix C.
