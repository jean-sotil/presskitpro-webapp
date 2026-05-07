import { describe, expect, it, vi } from 'vitest';

import { checkPressKitUrl, type CheckDeps } from './check-press-kit-url';

function fakeFetch(plan: Array<{ method?: string; status?: number; throw?: unknown; delayMs?: number }>): CheckDeps['fetch'] {
  let i = 0;
  return vi.fn(async (_url: string | URL, init?: RequestInit) => {
    const step = plan[i++];
    if (!step) throw new Error('fakeFetch: ran out of planned responses');
    if (step.delayMs) {
      await new Promise((r) => setTimeout(r, step.delayMs));
    }
    if (step.throw) throw step.throw;
    if (step.method && init?.method && init.method !== step.method) {
      throw new Error(`expected ${step.method} got ${init.method}`);
    }
    return new Response(null, { status: step.status ?? 200 });
  }) as unknown as CheckDeps['fetch'];
}

describe('checkPressKitUrl', () => {
  it('returns ok on a HEAD 2xx', async () => {
    const r = await checkPressKitUrl('https://example.com/k', {
      fetch: fakeFetch([{ method: 'HEAD', status: 200 }]),
    });
    expect(r).toEqual({ ok: true, kind: 'http-2xx', statusCode: 200 });
  });

  it('treats 3xx redirects as ok (the spec says we trust the final status — fetch follows by default)', async () => {
    const r = await checkPressKitUrl('https://example.com/k', {
      fetch: fakeFetch([{ method: 'HEAD', status: 301 }]),
    });
    expect(r.ok).toBe(true);
    expect(r.kind).toBe('http-3xx');
  });

  it('falls back to ranged GET when HEAD returns 405 Method Not Allowed', async () => {
    const fakeFn = fakeFetch([
      { method: 'HEAD', status: 405 },
      { method: 'GET', status: 200 },
    ]);
    const r = await checkPressKitUrl('https://example.com/k', { fetch: fakeFn });
    expect(r.ok).toBe(true);
    expect(r.kind).toBe('http-2xx');
    // 2 calls: HEAD then GET.
    expect((fakeFn as unknown as { mock: { calls: unknown[] } }).mock.calls).toHaveLength(2);
  });

  it('falls back to ranged GET on HEAD 4xx (some providers reject HEAD entirely)', async () => {
    const fakeFn = fakeFetch([
      { method: 'HEAD', status: 403 },
      { method: 'GET', status: 200 },
    ]);
    const r = await checkPressKitUrl('https://example.com/k', { fetch: fakeFn });
    expect(r.ok).toBe(true);
  });

  it('returns http-error when both HEAD and GET return ≥ 400', async () => {
    const r = await checkPressKitUrl('https://example.com/k', {
      fetch: fakeFetch([
        { method: 'HEAD', status: 404 },
        { method: 'GET', status: 404 },
      ]),
    });
    expect(r).toEqual({ ok: false, kind: 'http-error', statusCode: 404 });
  });

  it('returns network-error when fetch throws (DNS / TLS / abort that is not a timeout)', async () => {
    const r = await checkPressKitUrl('https://example.com/k', {
      fetch: fakeFetch([{ throw: new TypeError('fetch failed') }]),
    });
    expect(r.ok).toBe(false);
    expect(r.kind).toBe('network-error');
  });

  it('returns timeout when the request exceeds the timeout window', async () => {
    const r = await checkPressKitUrl('https://example.com/k', {
      fetch: fakeFetch([{ delayMs: 50, status: 200 }]),
      timeoutMs: 10,
    });
    expect(r.ok).toBe(false);
    expect(r.kind).toBe('timeout');
  });

  it('returns network-error for a non-string url or empty input', async () => {
    const r = await checkPressKitUrl('', { fetch: fakeFetch([]) });
    expect(r.ok).toBe(false);
    expect(r.kind).toBe('network-error');
  });
});
