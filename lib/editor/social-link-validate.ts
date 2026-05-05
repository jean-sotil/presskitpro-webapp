/**
 * Per-platform URL parsers + validators for the social-links editor.
 *
 * Two responsibilities:
 *   1. `parseAndCanonicalize(platform, raw)` — accepts the user's pasted
 *      input (handle, URL, phone number, email) and returns the canonical
 *      URL stored in the database. Always rebuilt from parsed parts —
 *      we never round-trip the user string verbatim, which closes the
 *      open-redirect/XSS surface called out in the spec.
 *   2. `validateLinks(items)` — list-level checks (cap, duplicate
 *      platform). Per-row errors come from `parseAndCanonicalize`.
 *
 * Pure module — safe to import from server + client. No DOM, no React.
 */

export const PLATFORMS = [
  'instagram',
  'tiktok',
  'soundcloud',
  'spotify',
  'youtube',
  'twitter',
  'bandcamp',
  'mixcloud',
  'apple-music',
  'beatport',
  'whatsapp',
  'email',
  'website',
] as const;

export type Platform = (typeof PLATFORMS)[number];

export const MAX_SOCIAL_LINKS = 10;

export type ParseReason = 'empty' | 'invalid' | 'wrong-host';

export type ParseResult =
  | { ok: true; canonical: string }
  | { ok: false; reason: ParseReason };

export function parseAndCanonicalize(
  platform: Platform,
  raw: string,
): ParseResult {
  const trimmed = (raw ?? '').trim();
  if (trimmed.length === 0) return { ok: false, reason: 'empty' };

  switch (platform) {
    case 'instagram':
      return parseHandleSite(trimmed, {
        hosts: ['instagram.com', 'www.instagram.com'],
        canonicalHost: 'www.instagram.com',
      });
    case 'tiktok':
      return parseHandleSite(trimmed, {
        hosts: ['tiktok.com', 'www.tiktok.com'],
        canonicalHost: 'www.tiktok.com',
        atPrefix: true,
      });
    case 'twitter':
      return parseHandleSite(trimmed, {
        hosts: ['twitter.com', 'www.twitter.com', 'x.com', 'www.x.com'],
        canonicalHost: 'x.com',
      });
    case 'soundcloud':
      return parseHandleSite(trimmed, {
        hosts: ['soundcloud.com', 'www.soundcloud.com'],
        canonicalHost: 'soundcloud.com',
      });
    case 'mixcloud':
      return parseHandleSite(trimmed, {
        hosts: ['mixcloud.com', 'www.mixcloud.com'],
        canonicalHost: 'www.mixcloud.com',
      });
    case 'bandcamp':
      return parseUrlOnly(trimmed, {
        hostSuffix: 'bandcamp.com',
      });
    case 'spotify':
      return parseUrlOnly(trimmed, { hostExact: 'open.spotify.com' });
    case 'youtube':
      return parseUrlOnly(trimmed, {
        hostsExact: ['youtube.com', 'www.youtube.com', 'youtu.be', 'm.youtube.com'],
      });
    case 'apple-music':
      return parseUrlOnly(trimmed, { hostExact: 'music.apple.com' });
    case 'beatport':
      return parseUrlOnly(trimmed, { hostSuffix: 'beatport.com' });
    case 'whatsapp':
      return parseWhatsapp(trimmed);
    case 'email':
      return parseEmail(trimmed);
    case 'website':
      return parseWebsite(trimmed);
  }
}

// ----- per-platform helpers ---------------------------------------------

type HandleSiteOpts = {
  hosts: string[];
  canonicalHost: string;
  /** TikTok prefixes the slug with `@` in its canonical URL. */
  atPrefix?: boolean;
};

function parseHandleSite(input: string, opts: HandleSiteOpts): ParseResult {
  // `@handle` form
  if (input.startsWith('@')) {
    const handle = input.slice(1).trim();
    if (handle.length === 0 || /[\s/]/.test(handle)) {
      return { ok: false, reason: 'invalid' };
    }
    const slug = opts.atPrefix ? `@${handle}` : handle;
    return { ok: true, canonical: `https://${opts.canonicalHost}/${slug}` };
  }
  // URL form
  const parsed = safeParseUrl(input);
  if (!parsed) return { ok: false, reason: 'invalid' };
  if (!opts.hosts.includes(parsed.host)) {
    return { ok: false, reason: 'wrong-host' };
  }
  const path = parsed.pathname.replace(/\/+$/, '');
  if (path === '' || path === '/') return { ok: false, reason: 'invalid' };
  return { ok: true, canonical: `https://${opts.canonicalHost}${path}` };
}

type UrlOnlyOpts =
  | { hostExact: string }
  | { hostsExact: string[] }
  | { hostSuffix: string };

function parseUrlOnly(input: string, opts: UrlOnlyOpts): ParseResult {
  const parsed = safeParseUrl(input);
  if (!parsed) return { ok: false, reason: 'invalid' };
  let hostOk = false;
  if ('hostExact' in opts) hostOk = parsed.host === opts.hostExact;
  else if ('hostsExact' in opts) hostOk = opts.hostsExact.includes(parsed.host);
  else hostOk = parsed.host === opts.hostSuffix || parsed.host.endsWith(`.${opts.hostSuffix}`);
  if (!hostOk) return { ok: false, reason: 'wrong-host' };
  const path = parsed.pathname.replace(/\/+$/, '') || '';
  if (path === '') return { ok: false, reason: 'invalid' };
  return { ok: true, canonical: `https://${parsed.host}${path}` };
}

function parseWhatsapp(input: string): ParseResult {
  // Accept an existing wa.me URL.
  if (/^https?:\/\//i.test(input)) {
    const parsed = safeParseUrl(input);
    if (!parsed) return { ok: false, reason: 'invalid' };
    if (parsed.host !== 'wa.me') return { ok: false, reason: 'wrong-host' };
    const digits = parsed.pathname.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 15) {
      return { ok: false, reason: 'invalid' };
    }
    return { ok: true, canonical: `https://wa.me/${digits}` };
  }
  const digits = input.replace(/[\s+()-]/g, '');
  if (!/^\d+$/.test(digits)) return { ok: false, reason: 'invalid' };
  // E.164 spec allows up to 15 digits including the country code; require
  // at least 10 (country code + meaningful number) so a stray local number
  // doesn't sneak through.
  if (digits.length < 10 || digits.length > 15) {
    return { ok: false, reason: 'invalid' };
  }
  return { ok: true, canonical: `https://wa.me/${digits}` };
}

function parseEmail(input: string): ParseResult {
  const stripped = input.replace(/^mailto:/i, '').trim();
  // Pragmatic, not RFC-5322. Catches the obvious-bad cases; the user is
  // their own first-line of defense (it's their email).
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(stripped)) {
    return { ok: false, reason: 'invalid' };
  }
  return { ok: true, canonical: `mailto:${stripped}` };
}

function parseWebsite(input: string): ParseResult {
  if (!/^https?:\/\//i.test(input)) return { ok: false, reason: 'invalid' };
  const parsed = safeParseUrl(input);
  if (!parsed) return { ok: false, reason: 'invalid' };
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return { ok: false, reason: 'invalid' };
  }
  const path = parsed.pathname.replace(/\/+$/, '') || '';
  return { ok: true, canonical: `${parsed.protocol}//${parsed.host}${path}` };
}

function safeParseUrl(input: string): URL | null {
  try {
    return new URL(input);
  } catch {
    return null;
  }
}

// ----- list-level validation --------------------------------------------

export type LinkInput = { platform: Platform; url: string };

export type LinksValidation =
  | { ok: true }
  | { ok: false; reason: 'too-many' }
  | { ok: false; reason: 'duplicate-platform'; index: number }
  | {
      ok: false;
      reason: 'item-invalid';
      index: number;
      itemReason: ParseReason;
    };

export function validateLinks(items: LinkInput[]): LinksValidation {
  if (items.length > MAX_SOCIAL_LINKS) return { ok: false, reason: 'too-many' };
  const seen = new Set<Platform>();
  for (let i = 0; i < items.length; i++) {
    const item = items[i]!;
    if (seen.has(item.platform)) {
      return { ok: false, reason: 'duplicate-platform', index: i };
    }
    seen.add(item.platform);
    const r = parseAndCanonicalize(item.platform, item.url);
    if (!r.ok) {
      return { ok: false, reason: 'item-invalid', index: i, itemReason: r.reason };
    }
  }
  return { ok: true };
}
