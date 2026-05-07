import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { checkSlugAvailability } from '@/lib/slug/check';
import { makeFindProfileBySlug, makeFindReservation } from '@/lib/slug/operations';
import { createRateLimiterFromEnv } from '@/lib/server/rate-limit-from-env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Task-27 — 30 hits / minute / IP. Bot-throttle on a publicly probable
// endpoint without making typing-while-onboarding feel laggy.
const slugLimiter = createRateLimiterFromEnv({
  windowMs: 60_000,
  max: 30,
  prefix: 'rl:slug',
});

function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]!.trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}

/**
 * GET /api/slug/check?slug=foo
 *
 * Public. Returns `{ available: boolean, reason?: SlugCheckReason }`.
 * `requestingUserId` is read from the session cookie if present so the
 * caller's own active hold doesn't make their slug appear taken.
 */
export async function GET(req: Request) {
  const limit = await slugLimiter.check(clientIp(req));
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'rate-limited' },
      {
        status: 429,
        headers: { 'Retry-After': String(limit.retryAfterSec) },
      },
    );
  }

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
