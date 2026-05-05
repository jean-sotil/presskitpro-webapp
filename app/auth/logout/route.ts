import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Clears the Supabase session and bounces home.
 *
 * POST-only on purpose:
 *   - Same-origin form submission (no CSRF risk with SameSite=Lax cookies).
 *   - GET would let any third-party `<img>` log a user out.
 */
export async function POST(req: Request) {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL('/', req.url), { status: 303 });
}
