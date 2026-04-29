# Task 02 — Supabase + Payload Architecture Spike

## Summary
Validate the dual-schema architecture (Payload owns content in `payload` schema; Supabase owns auth, storage, analytics in `public` schema) end-to-end before we commit the entire data model to it.

## PRD references
- §7 (Data model), §8 (Tech architecture), §18 row #1 (architectural decision flagged for week-1 spike).

## Dependencies
- task-01 (project scaffold).

## Scope (in)
- Stand up Supabase locally (`supabase start`).
- Wire Payload's Postgres adapter to that DB on the `payload` schema.
- Prove a round-trip: create a Supabase Auth user → webhook into a Payload `Users` collection → relation from a Payload `Profiles` row back to that user.
- Prove a Supabase Storage upload from the browser using a signed URL, with the Media metadata persisted in Payload.
- Document the migration story (who runs Payload migrations vs. Supabase migrations, in what order).

## Scope (out)
- Final shape of every collection (task-08 lands those).
- RLS policies (task-27).

## Acceptance criteria
- [ ] A new Supabase Auth user appears as a Payload `Users` document within 5s.
- [ ] Payload migrations run cleanly without colliding with Supabase tables.
- [ ] Browser-side test uploads a 2MB JPEG to Supabase Storage and the resulting Payload Media record links to the correct object.
- [ ] Decision log committed at `docs/decisions/0001-payload-supabase-split.md` either confirming the split or proposing an alternative.

## Implementation notes
- The webhook from Supabase Auth → Payload should be idempotent (handle replays).
- Encrypt service-role keys; never expose to client.
- Payload's Local API is the only way the public profile RSC reads content (per §8).

## Definition of Done
Per PRD Appendix C; spike artifact + decision doc + working demo route gated behind `?spike=1`.
