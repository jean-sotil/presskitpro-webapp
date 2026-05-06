import { expect, test } from '@playwright/test';
import { expectAxeClean } from './fixtures/axe';

/**
 * Task-25 — marketing surface a11y. Both routes are public + ISR'd, so
 * the test runs without auth.
 */
test.describe('A11y marketing @smoke', () => {
  test('/ renders, exposes a skip-to-content link, and is axe-clean', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/PressKit/i);
    // Skip link is sr-only — assert it's in the DOM as the first link.
    const skip = page.getByRole('link', { name: /pular para o conteúdo/i });
    await expect(skip).toBeAttached();
    await expect(skip).toHaveAttribute('href', '#main');
    // Every page has a single <main id="main">.
    await expect(page.locator('main#main')).toHaveCount(1);
    await expectAxeClean(page, '/');
  });

  test('/pricing renders, has one h1, and is axe-clean', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.locator('main#main')).toHaveCount(1);
    await expectAxeClean(page, '/pricing');
  });
});
