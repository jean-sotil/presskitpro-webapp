import { expect, test } from '@playwright/test';
import { expectAxeClean } from './fixtures/axe';

test.describe('Smoke @smoke', () => {
  test('home page renders and has zero critical/serious axe violations', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/PressKit/i);
    await expectAxeClean(page, '/');
  });

  test('design-system preview renders in dev mode', async ({ page, baseURL }) => {
    // The /dev/preview route is gated by NODE_ENV !== 'production'.
    // In CI we run against `bun run start` (production build) so the page
    // is expected to 404 there. Local dev or PLAYWRIGHT_BASE_URL pointing
    // at a dev server is the only environment where it should render.
    test.skip(process.env.CI === 'true' && !process.env.PLAYWRIGHT_BASE_URL,
      'preview is dev-only; CI runs production build');

    await page.goto('/dev/preview');
    await expect(page.getByRole('heading', { name: /editorial nightlife/i })).toBeVisible();
    void baseURL;
  });
});
