import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { safeNext } from '@/lib/auth/next-param';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Supabase magic-link / OAuth callback. Exchanges the `code` for a session
 * (writes session cookies via @supabase/ssr) then bounces to the safe `next`
 * URL or `/dashboard`.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const next = safeNext(url.searchParams.get('next'));

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', url.origin));
  }

  const supabase = await supabaseServer();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL('/login?error=callback_failed', url.origin));
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
