# Task 11 — Editor Sections: Bio & Services

## Summary
Two related editor blocks. Bio is a localized rich-text field; Services is a card list with title + description per item.

## PRD references
- §6.3 (Bio, Services), §6.4 (rendering on public page), §10 (i18n).

## Dependencies
- task-09, task-08 (`ProfileContent` collection).

## Scope (in)
- Bio: rich-text editor (Payload Lexical or Tiptap) with Heading (h2/h3), Bold, Italic, Lists, Link. Strip everything else on paste.
- Per-locale Bio tabs (locale tabs themselves come live in task-29; structurally support N locales now).
- Services: ordered list of `{title, description}` cards, drag-reorder, max 8 items.
- Empty-state copy that nudges Emerging-DJ persona ("Not sure what to write? Try…").
- Character counter on tagline-style title fields with soft warnings (not hard limits).

## Scope (out)
- AI-assisted bio generation (out of scope for v1).

## Acceptance criteria
- [ ] Pasting from Word/Google Docs yields clean HTML — no inline styles, no fonts.
- [ ] Reordering services persists immediately and reflects in the preview.
- [ ] Bio renders identically in editor preview and public page (verified by visual diff snapshot).
- [ ] Saving Services with an empty title is blocked with inline error.

## Implementation notes
- Rich-text serializer must round-trip safely; never store raw HTML.
- For Lexical: lock the toolbar config to the allowlist above.

## Definition of Done
Per Appendix C.
