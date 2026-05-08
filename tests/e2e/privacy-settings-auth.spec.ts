import { expect, test } from '@playwright/test';

/**
 * Task-33 PR-A — `/dashboard/settings/privacy` is dashboard-gated.
 * Without a Supabase session the page redirects to /login with a
 * `next` param pointing back at the settings page.
 */

test.describe('Privacy settings auth @smoke', () => {
  test('redirects to /login when unauthenticated', async ({ request }) => {
    const res = await request.get('/dashboard/settings/privacy', {
      maxRedirects: 0,
    });
    // Next.js issues a 307 redirect from the server-side `redirect()`
    // call inside the page component. Playwright's `request.get` does
    // not follow redirects when `maxRedirects: 0`.
    expect([302, 307, 308]).toContain(res.status());
    const location = res.headers()['location'] ?? '';
    expect(location).toContain('/login');
    expect(location).toContain(encodeURIComponent('/dashboard/settings/privacy'));
  });
});
