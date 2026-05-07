import { expect, test } from '@playwright/test';

/**
 * Task-26 — performance headers contract.
 *
 * Asserts the middleware Cache-Control branch fires for `/<slug>`-shaped
 * paths (single segment, not in `RESERVED_TOP_LEVEL_PATHS`) and stays
 * silent for authenticated dashboard paths and `/api/*`.
 *
 * The probe slug doesn't need to exist in the DB — the middleware
 * branches on path shape, not on a published profile. The route may
 * 404 the response, but the middleware-set `CDN-Cache-Control` header
 * still flows through.
 */

test.describe('Performance headers @smoke', () => {
  test('public profile path receives the edge cache headers', async ({ request }) => {
    const res = await request.get('/perf-cache-probe-task26', { maxRedirects: 0 });
    // Vercel-specific header isn't set anywhere else, so its presence
    // proves the middleware branch ran.
    const cdn = res.headers()['cdn-cache-control'] ?? '';
    expect(cdn).toContain('public');
    expect(cdn).toContain('s-maxage=3600');
    expect(cdn).toContain('stale-while-revalidate=86400');
  });

  test('dashboard path does not leak the public edge cache headers', async ({ request }) => {
    const res = await request.get('/dashboard', { maxRedirects: 0 });
    expect(res.headers()['cdn-cache-control']).toBeFalsy();
  });

  test('api/track path does not leak the public edge cache headers', async ({ request }) => {
    // The middleware matcher excludes `/api/*`, so neither the page-view
    // beacon side effects nor the cache headers should appear here.
    const res = await request.post('/api/track', {
      data: { event: 'page_view', profileSlug: 'noop' },
      failOnStatusCode: false,
    });
    expect(res.headers()['cdn-cache-control']).toBeFalsy();
  });
});
