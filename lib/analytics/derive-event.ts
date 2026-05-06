/**
 * Pure derivations from request metadata. Each function is total (never
 * throws) so the /api/track and middleware paths can run them without
 * try/catch ceremony.
 */

const RESERVED_TOP_LEVEL_PATHS = new Set([
  'api',
  'dashboard',
  'login',
  'signup',
  'onboarding',
  'checkout',
  'pricing',
  'admin',
  'auth',
  'dev',
  'spike',
  'sitemap.xml',
  'robots.txt',
]);

export function deriveProfileSlugFromPath(path: string): string | null {
  // Strip query and trailing slashes; we only count exact `/<slug>` hits.
  const cleaned = path.split('?')[0]!.replace(/\/+$/, '');
  if (cleaned === '' || cleaned === '/') return null;
  const parts = cleaned.split('/').filter(Boolean);
  if (parts.length !== 1) return null;
  const slug = parts[0]!;
  if (RESERVED_TOP_LEVEL_PATHS.has(slug)) return null;
  return slug;
}

export function deriveReferrerHost(
  referrer: string | null | undefined,
  opts: { selfHost?: string } = {},
): string | null {
  if (!referrer) return null;
  try {
    const u = new URL(referrer);
    if (opts.selfHost && u.host === opts.selfHost) return null;
    return u.host || null;
  } catch {
    return null;
  }
}

export function deriveLocale(header: string | null | undefined): string | null {
  if (!header) return null;
  const primary = header.split(',')[0]?.trim() ?? '';
  if (!primary) return null;
  // Accept-Language values are short (e.g. "pt-BR"). Cap defensively.
  return primary.slice(0, 20);
}
