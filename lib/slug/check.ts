import 'server-only';
import { containsProfanity, validateSlugFormat } from './validator';

export type SlugCheckReason =
  | 'too-short'
  | 'too-long'
  | 'invalid-chars'
  | 'reserved'
  | 'profane'
  | 'taken';

export type SlugCheckResult =
  | { available: true }
  | { available: false; reason: SlugCheckReason };

export type ReservationRow = {
  type: string;
  held_by_user_id: string | null;
  expires_at: string | null;
};

export type SlugCheckDeps = {
  findReservation: (slug: string) => Promise<ReservationRow | null>;
  findProfileBySlug: (slug: string) => Promise<{ id: string | number } | null>;
};

/**
 * Composes pure validators with DB lookups to answer "can this slug be used?".
 *
 * Order is intentional — fastest pure checks first, DB last:
 *   format → profanity → reserved (DB) → existing profile (DB) → active hold (DB).
 *
 * `requestingUserId` is the optional caller's user id; their OWN active
 * soft-hold counts as available so the wizard can re-poll without flapping.
 */
export async function checkSlugAvailability(
  args: { slug: string; requestingUserId?: string },
  deps: SlugCheckDeps,
): Promise<SlugCheckResult> {
  // Validate the raw input first — capitals/spaces/etc. are `invalid-chars`,
  // not "almost-OK". Lowercasing only happens after the gate passes, so DB
  // queries always run against canonical lowercase strings.
  const fmt = validateSlugFormat(args.slug);
  if (!fmt.ok) return { available: false, reason: fmt.reason };

  const slug = args.slug.toLowerCase();

  if (containsProfanity(slug)) return { available: false, reason: 'profane' };

  const reservation = await deps.findReservation(slug);
  if (reservation) {
    if (reservation.type === 'reserved') {
      return { available: false, reason: 'reserved' };
    }
    if (reservation.type === 'soft_hold') {
      const stillActive =
        reservation.expires_at &&
        new Date(reservation.expires_at).getTime() > Date.now();
      if (stillActive && reservation.held_by_user_id !== args.requestingUserId) {
        return { available: false, reason: 'taken' };
      }
    }
  }

  const profile = await deps.findProfileBySlug(slug);
  if (profile) return { available: false, reason: 'taken' };

  return { available: true };
}
