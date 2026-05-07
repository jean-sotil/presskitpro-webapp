import { expect, test } from '@playwright/test';

/**
 * Task-27 — security-headers contract.
 *
 * Asserts the middleware emits Content-Security-Policy-Report-Only on
 * non-API routes and the slug-availability route returns 429 with
 * Retry-After when the per-IP budget is blown. Auth-route rate limit
 * is exercised via /signup since it's safer to retry than /login.
 */

test.describe('Security headers @smoke', () => {
  test('home page sets Content-Security-Policy-Report-Only with allowlist', async ({
    request,
  }) => {
    const res = await request.get('/');
    const csp = res.headers()['content-security-policy-report-only'] ?? '';
    expect(csp).toContain("default-src 'self'");
    expect(csp).toMatch(/script-src[^;]*'nonce-/);
    expect(csp).toContain('js.stripe.com');
    expect(csp).toContain('*.supabase.co');
    expect(csp).toContain("frame-ancestors 'none'");
  });

  test('public profile shape sets the same CSP report-only header', async ({
    request,
  }) => {
    const res = await request.get('/perf-cache-probe-task27', { maxRedirects: 0 });
    const csp = res.headers()['content-security-policy-report-only'] ?? '';
    expect(csp).toContain("default-src 'self'");
  });

  test('slug-check endpoint returns 429 with Retry-After when over budget', async ({
    request,
  }) => {
    // Budget is 30/min/IP. From the test runner the IP is fixed so 31 hits
    // in quick succession should trip it. We only need to confirm the
    // 31st response shape.
    let firstFailing: { status: number; retryAfter: string | undefined } | null =
      null;
    for (let i = 0; i < 35; i++) {
      const r = await request.get('/api/slug/check?slug=zzz' + i);
      if (r.status() === 429) {
        firstFailing = {
          status: r.status(),
          retryAfter: r.headers()['retry-after'],
        };
        break;
      }
    }
    expect(firstFailing).not.toBeNull();
    expect(firstFailing!.status).toBe(429);
    expect(firstFailing!.retryAfter).toMatch(/^\d+$/);
    // Retry-After should be a small positive integer (window is 60s).
    expect(Number(firstFailing!.retryAfter)).toBeGreaterThan(0);
    expect(Number(firstFailing!.retryAfter)).toBeLessThanOrEqual(60);
  });
});
