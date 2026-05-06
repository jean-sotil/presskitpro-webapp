import { expect, test } from '@playwright/test';
import { expectAxeClean } from './fixtures/axe';

/**
 * Task-25 — dashboard surface a11y. Anonymous-redirect axe coverage
 * runs without auth. The `@full` block hits the editor shell with a
 * seeded user (skipped without env).
 */
test.describe('A11y dashboard @smoke', () => {
  test('/dashboard redirects to login (axe-clean)', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
    await expectAxeClean(page, '/dashboard (redirect)');
  });

  test('/dashboard/analytics redirects to login (axe-clean)', async ({ page }) => {
    await page.goto('/dashboard/analytics');
    await expect(page).toHaveURL(/\/login/);
    await expectAxeClean(page, '/dashboard/analytics (redirect)');
  });
});
