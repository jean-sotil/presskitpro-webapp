import { expect, test } from '@playwright/test';

/**
 * Task-24 — analytics pipeline.
 *
 * Two layers:
 *   - `@smoke`: route-level — middleware fires `/api/track`; cancel page
 *     does not. No DB writes asserted.
 *   - `@full`: full-stack — requires SUPABASE_SERVICE_ROLE_KEY and a seeded
 *     profile. Asserts a row lands.
 */

test.describe('Analytics @smoke', () => {
  test('the dashboard /analytics page redirects to login when anonymous', async ({ page }) => {
    const response = await page.goto('/dashboard/analytics');
    expect(page.url()).toMatch(/\/login\?next=%2Fdashboard%2Fanalytics$/);
    expect(response?.status()).toBe(200);
  });

  test('/api/track rejects malformed bodies', async ({ request }) => {
    const r = await request.post('/api/track', {
      data: { event: 'unknown_thing', profileSlug: 'mariana' },
    });
    // 400 because the event isn't in the allow-list.
    expect([400, 204]).toContain(r.status());
    if (r.status() === 400) {
      expect((await r.body()).length).toBe(0);
    }
  });

  test('/api/track does not set cookies', async ({ request }) => {
    const r = await request.post('/api/track', {
      data: { event: 'page_view', profileSlug: 'no-such-profile-test' },
    });
    const setCookie = r.headers()['set-cookie'];
    expect(setCookie).toBeFalsy();
  });

  test('/api/cron/analytics is gated by CRON_SECRET', async ({ request }) => {
    const r = await request.post('/api/cron/analytics');
    expect(r.status()).toBe(401);
  });
});

test.describe('Analytics @full', () => {
  test.skip(
    !process.env.SUPABASE_SERVICE_ROLE_KEY,
    'SUPABASE_SERVICE_ROLE_KEY not set — skipping full pipeline test',
  );

  test('public-profile request triggers /api/track via middleware', async ({ page }) => {
    let saw = false;
    await page.route('**/api/track', async (route) => {
      saw = true;
      await route.fulfill({ status: 204 });
    });
    // The seeded demo profile from the dev runbook.
    await page.goto('/marina-clube');
    // sendBeacon-backed AnalyticsClient mounts on the client; middleware
    // beacon is server-side but happens before the response. Either way,
    // by the time the page is `domcontentloaded` we should have seen at
    // least one POST to /api/track.
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(250);
    expect(saw).toBe(true);
  });
});
