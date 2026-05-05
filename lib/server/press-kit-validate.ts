/**
 * Server-side reachability check for an artist's external press-kit URL.
 *
 * Strategy: HEAD with an 8s timeout. Some hosts (Mediafire, occasional
 * CDNs) reject HEAD with 405; in that case we retry with a 1-byte ranged
 * GET. Google Drive is special — it returns 200 + an HTML page even
 * when the file is access-restricted, so we probe the body when the
 * provider is `google-drive` and look for the standard "Access denied"
 * title. The result is non-blocking (a `warning`, not a failure) so the
 * artist can still save and address it later.
 *
 * Pure-ish (DI fetch, DI now). The route handler at
 * `app/api/press-kit-validate/route.ts` wires `globalThis.fetch`.
 */

import {
  derivePressKitProvider,
  type PressKitProvider,
} from '../payload/hooks/derive-press-kit-provider';

export const VALIDATE_TIMEOUT_MS = 8_000;

export type ValidateReason =
  | 'invalid-url'
  | 'not-found'
  | 'server-error'
  | 'method-not-allowed'
  | 'timeout'
  | 'unreachable';

export type ValidateWarning = 'restrictive-access';

export type ValidateResult =
  | {
      ok: true;
      provider: PressKitProvider;
      status: number;
      finalUrl?: string;
      warning?: ValidateWarning;
    }
  | { ok: false; reason: ValidateReason; status?: number };

export type ValidateDeps = {
  url: string;
  fetch?: typeof fetch;
  abortSignal?: AbortSignal;
};

export async function validatePressKitUrl(
  deps: ValidateDeps,
): Promise<ValidateResult> {
  const fetchFn = deps.fetch ?? globalThis.fetch;
  let parsed: URL;
  try {
    parsed = new URL(deps.url);
  } catch {
    return { ok: false, reason: 'invalid-url' };
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return { ok: false, reason: 'invalid-url' };
  }

  const provider = derivePressKitProvider(deps.url);

  const headResult = await safeFetch(fetchFn, deps.url, {
    method: 'HEAD',
    redirect: 'follow',
    signal: deps.abortSignal,
  });
  if (!headResult.ok) return headResult;

  let res = headResult.response;
  // Some hosts disallow HEAD — retry with a ranged GET.
  if (res.status === 405) {
    const rangedResult = await safeFetch(fetchFn, deps.url, {
      method: 'GET',
      redirect: 'follow',
      headers: { Range: 'bytes=0-0' },
      signal: deps.abortSignal,
    });
    if (!rangedResult.ok) return rangedResult;
    res = rangedResult.response;
  }

  if (res.status === 404) {
    return { ok: false, reason: 'not-found', status: 404 };
  }
  if (res.status >= 500) {
    return { ok: false, reason: 'server-error', status: res.status };
  }
  if (res.status >= 400) {
    return { ok: false, reason: 'server-error', status: res.status };
  }

  // Drive's "this file is restricted" page returns 200 — probe.
  let warning: ValidateWarning | undefined;
  if (
    provider === 'google-drive' &&
    (res.headers.get('content-type') ?? '').includes('text/html')
  ) {
    const probe = await safeFetch(fetchFn, deps.url, {
      method: 'GET',
      redirect: 'follow',
      signal: deps.abortSignal,
    });
    if (probe.ok) {
      const text = await probe.response
        .text()
        .then((t) => t.slice(0, 4_000))
        .catch(() => '');
      if (/<title>[^<]*access denied[^<]*<\/title>/i.test(text)) {
        warning = 'restrictive-access';
      }
    }
  }

  return {
    ok: true,
    provider,
    status: res.status,
    finalUrl: res.url || undefined,
    ...(warning ? { warning } : {}),
  };
}

type SafeFetchResult =
  | { ok: true; response: Response }
  | { ok: false; reason: ValidateReason; status?: number };

async function safeFetch(
  fetchFn: typeof fetch,
  url: string,
  init: RequestInit,
): Promise<SafeFetchResult> {
  // Compose caller's abort signal with our own timeout.
  const timeout = AbortSignal.timeout(VALIDATE_TIMEOUT_MS);
  const signal = init.signal
    ? anyAbortSignal([init.signal, timeout])
    : timeout;
  try {
    const response = await fetchFn(url, { ...init, signal });
    return { ok: true, response };
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return { ok: false, reason: 'timeout' };
    }
    return { ok: false, reason: 'unreachable' };
  }
}

function anyAbortSignal(signals: AbortSignal[]): AbortSignal {
  // Polyfill for `AbortSignal.any` if the runtime lacks it.
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
