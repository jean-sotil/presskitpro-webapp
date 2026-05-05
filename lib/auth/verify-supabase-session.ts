import 'server-only';

import { createServerClient, type CookieOptions } from '@supabase/ssr';

/**
 * The thin boundary between Payload's auth strategy and Supabase Auth.
 *
 * Given a `Headers` object from a Payload REST request, returns the
 * verified Supabase user id + email, or `null` when no valid session
 * is attached. Errors are swallowed (logged-out behavior) — the caller
 * surfaces 401 by returning `{ user: null }` to Payload.
 *
 * Why a separate boundary: keeps the Payload strategy testable without
 * mocking `@supabase/ssr` directly, and lets the auth-sync webhook reuse
 * cookie parsing if it ever needs to.
 */

export type SupabaseUserSummary = {
  supabaseUserId: string;
  email: string | null;
};

type CreateClient = typeof createServerClient;

export type VerifyDeps = {
  createClient?: CreateClient;
};

const DEFAULT_DEPS: Required<VerifyDeps> = {
  createClient: createServerClient,
};

export async function verifySupabaseSession(
  headers: Headers,
  deps: VerifyDeps = {},
): Promise<SupabaseUserSummary | null> {
  const cookieHeader = headers.get('cookie');
  if (!cookieHeader) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  const parsed = parseCookieHeader(cookieHeader);
  const factory = deps.createClient ?? DEFAULT_DEPS.createClient;

  try {
    const client = factory(url, anonKey, {
      cookies: {
        getAll: () =>
          parsed.map(({ name, value }) => ({ name, value })),
        setAll: (_: { name: string; value: string; options?: CookieOptions }[]) => {
          // Payload strategies don't write response cookies on the auth path —
          // session refresh happens through the Next.js middleware client.
        },
      },
    });
    const { data, error } = await client.auth.getUser();
    if (error || !data?.user) return null;
    return { supabaseUserId: data.user.id, email: data.user.email ?? null };
  } catch {
    return null;
  }
}

/**
 * Minimal RFC 6265 cookie-header parser. Preserves order so tests can assert
 * on round-trip stability and cookie collisions resolve to "first wins".
 */
export function parseCookieHeader(header: string): Array<{ name: string; value: string }> {
  return header
    .split(';')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => {
      const eq = segment.indexOf('=');
      if (eq < 0) return { name: segment, value: '' };
      return {
        name: segment.slice(0, eq).trim(),
        value: decodeURIComponent(segment.slice(eq + 1).trim()),
      };
    });
}
