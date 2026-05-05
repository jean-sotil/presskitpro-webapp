import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { payload } from '@/lib/payload';
import type { ReservationRow } from './check';

const SOFT_HOLD_TTL_MINUTES = 15;
const REDIRECT_TTL_DAYS = 90;

/**
 * Adapters that bridge the live Supabase + Payload clients to the pure
 * `checkSlugAvailability` function's `SlugCheckDeps` shape.
 */

export function makeFindReservation(supabase: SupabaseClient) {
  return async (slug: string): Promise<ReservationRow | null> => {
    const { data, error } = await supabase
      .from('slug_reservations')
      .select('type, held_by_user_id, expires_at')
      .eq('slug', slug)
      .maybeSingle();
    if (error) throw error;
    return (data as ReservationRow | null) ?? null;
  };
}

export function makeFindProfileBySlug() {
  return async (slug: string): Promise<{ id: string | number } | null> => {
    const p = await payload();
    const result = await p.find({
      collection: 'profiles',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
    });
    const doc = result.docs[0];
    return doc ? { id: doc.id } : null;
  };
}

// ---------- mutating operations ------------------------------------------

export async function reserveSlug(
  supabase: SupabaseClient,
  args: { slug: string; userId: string; ttlMinutes?: number },
): Promise<{ ok: true; expiresAt: string }> {
  const ttl = args.ttlMinutes ?? SOFT_HOLD_TTL_MINUTES;
  const expiresAt = new Date(Date.now() + ttl * 60_000).toISOString();

  const { error } = await supabase.from('slug_reservations').upsert(
    {
      slug: args.slug.toLowerCase(),
      type: 'soft_hold',
      held_by_user_id: args.userId,
      expires_at: expiresAt,
    },
    { onConflict: 'slug' },
  );
  if (error) throw error;

  return { ok: true, expiresAt };
}

export async function releaseSlug(
  supabase: SupabaseClient,
  args: { slug: string; userId: string },
): Promise<void> {
  // Only delete rows the requesting user actually owns. A reserved-word row
  // (held_by_user_id IS NULL) is never matched by this filter, so it stays.
  const { error } = await supabase
    .from('slug_reservations')
    .delete()
    .eq('slug', args.slug.toLowerCase())
    .eq('type', 'soft_hold')
    .eq('held_by_user_id', args.userId);
  if (error) throw error;
}

export async function recordSlugChange(
  supabase: SupabaseClient,
  args: { oldSlug: string; newSlug: string },
): Promise<void> {
  const expiresAt = new Date(
    Date.now() + REDIRECT_TTL_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  // Idempotent: if the same `old_slug` already redirects, refresh its target
  // and TTL. Don't accidentally chain redirects (old → mid → new) — the
  // caller is responsible for not pointing one redirect at another.
  const { error } = await supabase.from('slug_redirects').upsert(
    {
      old_slug: args.oldSlug.toLowerCase(),
      new_slug: args.newSlug.toLowerCase(),
      expires_at: expiresAt,
    },
    { onConflict: 'old_slug' },
  );
  if (error) throw error;
}
