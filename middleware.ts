import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { decideRedirect } from '@/lib/auth/decide-redirect';

type CookieToSet = { name: string; value: string; options?: CookieOptions };

/**
 * Auth middleware.
 *
 * Reads the Supabase session cookie (no network call — just a cookie check)
 * and applies our pure `decideRedirect` policy. Real session validation
 * happens in server components via `supabase.auth.getUser()`; middleware is
 * a fast UX redirect, not the security boundary.
 */
export async function middleware(req: NextRequest) {
  const res = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookies: CookieToSet[]) {
          for (const { name, value, options } of cookies) {
            res.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const decision = decideRedirect({
    pathname: req.nextUrl.pathname,
    hasSession: !!session,
    currentNext: req.nextUrl.searchParams.get('next'),
  });

  if (decision.kind === 'redirect') {
    const url = req.nextUrl.clone();
    const [path, search] = decision.to.split('?');
    url.pathname = path ?? '/';
    url.search = search ? `?${search}` : '';
    return NextResponse.redirect(url);
  }

  // Vary on Accept-Language so future locale negotiation (task-29)
  // doesn't get the wrong cached entry. Per PRD §18 risk #12.
  res.headers.append('Vary', 'Accept-Language');
  return res;
}

export const config = {
  matcher: [
    // Run on protected paths and the auth pages.
    // Skip API, static assets, and internal Next routes.
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:png|jpg|jpeg|svg|webp|gif|ico|woff2?|ttf|otf)$).*)',
  ],
};
