import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { checkSlugAvailability } from '@/lib/slug/check';
import {
  makeFindProfileBySlug,
  makeFindReservation,
  reserveSlug,
} from '@/lib/slug/operations';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/slug/reserve  body: { slug: string }
 *
 * Auth required. Soft-holds the slug for 15 minutes for the calling user.
 * Idempotent — re-calling refreshes the TTL.
 *
 * Returns `{ ok: true, expiresAt }` or `{ ok: false, reason }` on conflict.
 */
export async function POST(req: Request) {
  const session = await supabaseServer();
  const {
    data: { user },
  } = await session.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, reason: 'unauthenticated' }, { status: 401 });
  }

  let body: { slug?: string };
  try {
    body = (await req.json()) as { slug?: string };
  } catch {
    return NextResponse.json({ ok: false, reason: 'invalid-body' }, { status: 400 });
  }
  if (!body.slug) {
    return NextResponse.json({ ok: false, reason: 'invalid-body' }, { status: 400 });
  }

  const admin = supabaseAdmin();

  // Re-validate before reserving — the wizard polls /check, but a stale
  // client could try to reserve a now-taken slug. Re-running the gate keeps
  // /reserve a single source of truth.
  const check = await checkSlugAvailability(
    { slug: body.slug, requestingUserId: user.id },
    {
      findReservation: makeFindReservation(admin),
      findProfileBySlug: makeFindProfileBySlug(),
    },
  );
  if (!check.available) {
    return NextResponse.json({ ok: false, reason: check.reason }, { status: 409 });
  }

  const { expiresAt } = await reserveSlug(admin, {
    slug: body.slug,
    userId: user.id,
  });

  return NextResponse.json({ ok: true, expiresAt });
}
