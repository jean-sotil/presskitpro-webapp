/**
 * Server-side fetcher for SoundCloud's public oEmbed endpoint.
 *
 * Hits `https://soundcloud.com/oembed?url=...&format=json`, validates
 * the JSON shape, and runs the response `html` through
 * `extractSafeIframe` to rebuild a trusted iframe. The returned string
 * is what the caller persists as `FeaturedTracks.oembedHtml`.
 *
 * Pure-ish (DI fetch + DI now). The route handler at
 * `app/api/profiles/[id]/featured-track/route.ts` wires the live deps.
 */

import { extractSafeIframe } from './sanitize-soundcloud-iframe';

export const OEMBED_TIMEOUT_MS = 8_000;
const OEMBED_BASE = 'https://soundcloud.com/oembed';

export type OembedReason =
  | 'invalid-url'
  | 'invalid-host'
  | 'not-found'
  | 'upstream-error'
  | 'malformed-response'
  | 'sanitization-failed'
  | 'timeout'
  | 'network';

export type OembedResult =
  | { ok: true; oembedHtml: string; title: string; fetchedAt: string }
  | { ok: false; reason: OembedReason; status?: number };

export type OembedDeps = {
  url: string;
  fetch?: typeof fetch;
  now?: () => number;
  abortSignal?: AbortSignal;
};

export async function fetchSoundcloudOembed(
  deps: OembedDeps,
): Promise<OembedResult> {
  const fetchFn = deps.fetch ?? globalThis.fetch;
  const now = deps.now ?? Date.now;

  let parsed: URL;
  try {
    parsed = new URL(deps.url);
  } catch {
    return { ok: false, reason: 'invalid-url' };
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return { ok: false, reason: 'invalid-url' };
  }
  // Accept the bare domain or any subdomain (m.soundcloud.com,
  // soundcloud.com — but not foo.soundcloud.evil.com).
  if (
    parsed.host !== 'soundcloud.com' &&
    !parsed.host.endsWith('.soundcloud.com')
  ) {
    return { ok: false, reason: 'invalid-host' };
  }

  const oembedUrl = `${OEMBED_BASE}?url=${encodeURIComponent(deps.url)}&format=json`;

  const timeoutSignal = AbortSignal.timeout(OEMBED_TIMEOUT_MS);
  const signal = deps.abortSignal
    ? anyAbortSignal([deps.abortSignal, timeoutSignal])
    : timeoutSignal;

  let res: Response;
  try {
    res = await fetchFn(oembedUrl, { method: 'GET', signal });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return { ok: false, reason: 'timeout' };
    }
    return { ok: false, reason: 'network' };
  }

  if (res.status === 404) return { ok: false, reason: 'not-found' };
  if (!res.ok) {
    return { ok: false, reason: 'upstream-error', status: res.status };
  }

  let body: { html?: unknown; title?: unknown };
  try {
    body = (await res.json()) as { html?: unknown; title?: unknown };
  } catch {
    return { ok: false, reason: 'malformed-response' };
  }
  if (typeof body.html !== 'string') {
    return { ok: false, reason: 'malformed-response' };
  }
  const title = typeof body.title === 'string' ? body.title : 'Faixa em destaque';
  const safe = extractSafeIframe(body.html, title);
  if (!safe) {
    return { ok: false, reason: 'sanitization-failed' };
  }
  return {
    ok: true,
    oembedHtml: safe,
    title,
    fetchedAt: new Date(now()).toISOString(),
  };
}

function anyAbortSignal(signals: AbortSignal[]): AbortSignal {
  const anyOf = (
    AbortSignal as unknown as {
      any?: (s: AbortSignal[]) => AbortSignal;
    }
  ).any;
  if (anyOf) return anyOf(signals);
  const ctrl = new AbortController();
  for (const s of signals) {
    if (s.aborted) {
      ctrl.abort(s.reason);
      break;
    }
    s.addEventListener('abort', () => ctrl.abort(s.reason), { once: true });
  }
  return ctrl.signal;
}
