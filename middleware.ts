import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { decideRedirect } from '@/lib/auth/decide-redirect';
import { deriveProfileSlugFromPath } from '@/lib/analytics/derive-event';

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

  // Task-24 — public profile page-view capture. Fires for `/<slug>` only;
  // skipped for everything else by `deriveProfileSlugFromPath`. We do NOT
  // await this — the page must serve from cache without a network round-trip.
  if (req.method === 'GET') {
    const slug = deriveProfileSlugFromPath(req.nextUrl.pathname);
    if (slug) {
      firePageViewBeacon(req, slug);
      // Task-26 — edge cache for the public profile route. The page is
      // already ISR-revalidated every hour; layering CDN cache on top
      // lets Vercel serve a fresh page for 1h and stale for 24h while
      // regen runs. `deriveProfileSlugFromPath` already excludes
      // `/api`, `/dashboard`, etc., so authenticated routes never
      // receive these headers.
      const cache = 'public, s-maxage=3600, stale-while-revalidate=86400';
      res.headers.set('Cache-Control', cache);
      res.headers.set('CDN-Cache-Control', cache);
    }
  }
  return res;
}

function firePageViewBeacon(req: NextRequest, slug: string): void {
  if (process.env.ANALYTICS_BEACON_DISABLED === '1') return;
  // Build the absolute URL to /api/track from the incoming request so
  // it works on every Vercel preview without env config.
  const base = new URL(req.nextUrl.origin);
  base.pathname = '/api/track';
  const headers = new Headers({
    'content-type': 'application/json',
    // Pass through the bits /api/track needs to derive the visitor hash
    // and locale. The runtime `fetch` inside middleware doesn't inherit
    // request headers automatically.
    'user-agent': req.headers.get('user-agent') ?? '',
    'accept-language': req.headers.get('accept-language') ?? '',
    'x-forwarded-for': req.headers.get('x-forwarded-for') ?? '',
  });
  const country = req.headers.get('x-vercel-ip-country');
  if (country) headers.set('x-vercel-ip-country', country);
  void fetch(base.toString(), {
    method: 'POST',
    headers,
    body: JSON.stringify({
      event: 'page_view',
      profileSlug: slug,
      referrer: req.headers.get('referer') ?? null,
    }),
    keepalive: true,
  }).catch(() => {
    // Analytics is best-effort; never block the user-facing path.
  });
}

export const config = {
  matcher: [
    // Run on protected paths and the auth pages.
    // Skip API, static assets, and internal Next routes.
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:png|jpg|jpeg|svg|webp|gif|ico|woff2?|ttf|otf)$).*)',
  ],
};
