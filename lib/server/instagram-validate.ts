/**
 * Parser/canonicalizer for Instagram post URLs.
 *
 * Accepts `/p/`, `/reel/`, and `/tv/` paths on `instagram.com` (with or
 * without the `www.` prefix). Strips query/hash, normalizes the host
 * to `www.instagram.com`, and trims to `<host>/<kind>/<shortcode>/`.
 *
 * Profile pages (`/dj_x/`) and discovery pages (`/explore/`) are
 * rejected — only individual posts can host an embed.
 */

export type IgKind = 'post' | 'reel' | 'tv';

export type ParseReason =
  | 'empty'
  | 'invalid-url'
  | 'wrong-host'
  | 'invalid-path';

export type ParseResult =
  | { ok: true; kind: IgKind; shortcode: string; canonical: string }
  | { ok: false; reason: ParseReason };

const PATH_RE = /^\/(p|reel|tv)\/([^/]+)\/?$/;

export function parseInstagramPostUrl(raw: string): ParseResult {
  const trimmed = (raw ?? '').trim();
  if (trimmed.length === 0) return { ok: false, reason: 'empty' };

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, reason: 'invalid-url' };
  }
  if (parsed.protocol !== 'https:') return { ok: false, reason: 'invalid-url' };
  if (
    parsed.host !== 'instagram.com' &&
    parsed.host !== 'www.instagram.com'
  ) {
    return { ok: false, reason: 'wrong-host' };
  }

  const match = PATH_RE.exec(parsed.pathname);
  if (!match) return { ok: false, reason: 'invalid-path' };
  const segment = match[1]!;
  const shortcode = match[2]!;
  if (shortcode.length === 0) return { ok: false, reason: 'invalid-path' };
  const kind: IgKind = segment === 'p' ? 'post' : (segment as IgKind);

  return {
    ok: true,
    kind,
    shortcode,
    canonical: `https://www.instagram.com/${segment}/${shortcode}/`,
  };
}
