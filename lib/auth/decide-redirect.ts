import { safeNext } from './next-param';

export type RedirectInput = {
  /** URL pathname (no query string). */
  pathname: string;
  /** Whether a Supabase session was found in the request cookies. */
  hasSession: boolean;
  /** The `next` query param when present, used when bouncing signed-in users. */
  currentNext?: string | null;
};

export type RedirectDecision =
  | { kind: 'allow' }
  | { kind: 'redirect'; to: string };

const PROTECTED_PREFIXES = ['/dashboard', '/admin'];
const AUTH_PAGES = new Set(['/login', '/signup']);

function isProtected(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

/**
 * Pure middleware decision. No I/O; the caller (middleware.ts) supplies
 * `hasSession` after reading cookies.
 */
export function decideRedirect({
  pathname,
  hasSession,
  currentNext,
}: RedirectInput): RedirectDecision {
  if (isProtected(pathname)) {
    if (!hasSession) {
      return {
        kind: 'redirect',
        to: `/login?next=${encodeURIComponent(pathname)}`,
      };
    }
    return { kind: 'allow' };
  }

  if (AUTH_PAGES.has(pathname) && hasSession) {
    return { kind: 'redirect', to: safeNext(currentNext) };
  }

  return { kind: 'allow' };
}
