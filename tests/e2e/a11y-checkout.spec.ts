import { expect, test } from '@playwright/test';
import { expectAxeClean } from './fixtures/axe';

/**
 * Task-25 — checkout surface a11y. The redirect to Stripe is off-domain
 * — we only assert axe against our own pages.
 */
test.describe('A11y checkout @smoke', () => {
  test('/checkout/canceled is axe-clean', async ({ page }) => {
    await page.goto('/checkout/canceled');
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.locator('main#main')).toHaveCount(1);
    await expectAxeClean(page, '/checkout/canceled');
  });

  test('/checkout/success is axe-clean', async ({ page }) => {
    await page.goto('/checkout/success');
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.locator('main#main')).toHaveCount(1);
    await expectAxeClean(page, '/checkout/success');
  });

  test('anonymous /checkout/pro-monthly redirects to login (axe-clean)', async ({ page }) => {
    await page.goto('/checkout/pro-monthly');
    await expect(page).toHaveURL(/\/login/);
    await expectAxeClean(page, '/checkout/pro-monthly (redirect)');
  });
});
