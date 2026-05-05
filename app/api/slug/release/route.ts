import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { releaseSlug } from '@/lib/slug/operations';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/slug/release  body: { slug: string }
 *
 * Auth required. Drops the caller's own soft-hold on the slug.
 * Reserved-word rows are never affected (different `held_by_user_id`).
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

  await releaseSlug(supabaseAdmin(), { slug: body.slug, userId: user.id });
  return NextResponse.json({ ok: true });
}
