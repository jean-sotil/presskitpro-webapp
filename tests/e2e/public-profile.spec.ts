import { expect, test } from '@playwright/test';

/**
 * Public profile route E2E (task-19). Full-only — needs a published
 * profile in the dev DB. Use `EDITOR_E2E_PROFILE_SLUG` for the live
 * route + `EDITOR_E2E_DRAFT_SLUG` for a 404 smoke (a profile that
 * exists but isn't published, e.g. a fresh draft).
 */

test.describe('Public profile full ladder @full', () => {
  test.skip(
    !process.env.EDITOR_E2E_PROFILE_SLUG,
    'Set EDITOR_E2E_PROFILE_SLUG to a published slug.',
  );

  test('renders the published profile with a single h1 and Vary header', async ({
    request,
    page,
  }) => {
    const slug = process.env.EDITOR_E2E_PROFILE_SLUG!;
    const res = await request.get(`/${slug}`, { maxRedirects: 0 });
    expect(res.status()).toBe(200);
    const vary = res.headers()['vary'] ?? '';
    expect(vary.toLowerCase()).toContain('accept-language');

    await page.goto(`/${slug}`);
    const headings = await page.locator('h1').all();
    expect(headings.length).toBe(1);

    // Anchor nav should be visible when at least one section has content.
    // (If the seed profile is empty the nav doesn't render — skip the assert
    // by guard.)
    const nav = page.getByRole('navigation', { name: /seções/i });
    if ((await nav.count()) > 0) {
      await expect(nav).toBeVisible();
    }
  });

  test('returns 404 for an unpublished slug', async ({ request }) => {
    test.skip(
      !process.env.EDITOR_E2E_DRAFT_SLUG,
      'Set EDITOR_E2E_DRAFT_SLUG to a draft slug to exercise the 404 path.',
    );
    const slug = process.env.EDITOR_E2E_DRAFT_SLUG!;
    const res = await request.get(`/${slug}`);
    expect(res.status()).toBe(404);
  });
});
