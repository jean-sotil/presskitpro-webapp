import { expect, test } from '@playwright/test';
import { expectAxeClean } from './fixtures/axe';

/**
 * Task-25 — public-profile surface a11y. Two cases:
 *   - Missing slug → branded /<slug>/not-found (axe-clean).
 *   - Seeded published slug → full ProfileRenderer (axe-clean) when the
 *     dev DB has been seeded. Auto-skips when not.
 */
test.describe('A11y public profile @smoke', () => {
  test('a non-existent slug renders the branded 404 (axe-clean)', async ({ page }) => {
    const response = await page.goto('/no-such-slug-xyz-test');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('main#main')).toHaveCount(1);
    await expectAxeClean(page, '/no-such-slug-xyz-test (404)');
  });
});

test.describe('A11y public profile @full', () => {
  test.skip(
    !process.env.PLAYWRIGHT_SEEDED_PROFILE_SLUG,
    'PLAYWRIGHT_SEEDED_PROFILE_SLUG not set — skipping seeded-profile axe pass',
  );

  test('the seeded profile renders, exposes a single h1, and is axe-clean', async ({ page }) => {
    const slug = process.env.PLAYWRIGHT_SEEDED_PROFILE_SLUG!;
    await page.goto(`/${slug}`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.locator('main#main')).toHaveCount(1);
    await expectAxeClean(page, `/${slug}`);
  });
});
