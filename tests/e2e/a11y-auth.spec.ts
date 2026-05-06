import { expect, test } from '@playwright/test';
import { expectAxeClean } from './fixtures/axe';

/**
 * Task-25 — auth surface a11y. Existing `auth.spec.ts` carries the
 * functional + axe checks for /login. This file extends to /signup
 * (which the auth spec only renders without axe) and the redirect
 * surfaces.
 */
test.describe('A11y auth @smoke', () => {
  test('/login is axe-clean and the email input is labeled', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel(/e-mail/i)).toBeVisible();
    await expect(page.locator('main#main')).toHaveCount(1);
    await expectAxeClean(page, '/login');
  });

  test('/signup is axe-clean and exposes a labeled email input', async ({ page }) => {
    await page.goto('/signup');
    // Both /login and /signup share the OTP-style flow with a single
    // email field. Don't over-specify the heading — the layout may
    // reword it later.
    await expect(page.getByLabel(/e-mail/i)).toBeVisible();
    await expect(page.locator('main#main')).toHaveCount(1);
    await expectAxeClean(page, '/signup');
  });
});
