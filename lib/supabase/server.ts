import 'server-only';

import { createServerClient, type CookieOptions } from '@supabase/ssr';

type CookieToSet = { name: string; value: string; options?: CookieOptions };
import { cookies } from 'next/headers';
import { cache } from 'react';

/**
 * Server-side Supabase client wired to Next.js's request `cookies()`.
 *
 * Use in:
 *   - Server components — to read the current user (`auth.getUser()`).
 *   - Route handlers (login callback, logout) — to write/clear session cookies.
 *   - Middleware uses `createMiddlewareClient` directly (different cookie API).
 *
 * The instance is `cache()`-d per request so multiple `auth.getUser()` calls
 * across nested server components share one client.
 */
export const supabaseServer = cache(async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          // In server components Next forbids cookie writes; the
          // `set` calls happen inside route handlers and middleware
          // where the response cookie API is available. Wrap in
          // try/catch so RSC reads don't throw.
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options as CookieOptions);
            }
          } catch {
            // Ignored — see comment above.
          }
        },
      },
    },
  );
});
