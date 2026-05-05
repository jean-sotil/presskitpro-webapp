import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { checkSlugAvailability } from '@/lib/slug/check';
import { makeFindProfileBySlug, makeFindReservation } from '@/lib/slug/operations';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/slug/check?slug=foo
 *
 * Public. Returns `{ available: boolean, reason?: SlugCheckReason }`.
 * `requestingUserId` is read from the session cookie if present so the
 * caller's own active hold doesn't make their slug appear taken.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get('slug');

  if (!slug) {
    return NextResponse.json({ available: false, reason: 'invalid-chars' });
  }

  const session = await supabaseServer();
  const {
    data: { user },
  } = await session.auth.getUser();

  const admin = supabaseAdmin();
  const result = await checkSlugAvailability(
    { slug, requestingUserId: user?.id },
    {
      findReservation: makeFindReservation(admin),
      findProfileBySlug: makeFindProfileBySlug(),
    },
  );

  return NextResponse.json(result);
}
