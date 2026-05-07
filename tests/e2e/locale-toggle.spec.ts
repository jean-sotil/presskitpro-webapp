import { expect, test } from '@playwright/test';

import { LOCALE_COOKIE_NAME } from '@/lib/i18n/locale';

/**
 * Task-29 PR-A — locale toggle.
 *
 * Asserts the cookie-driven locale switch:
 *   1. PT renders by default for a fresh visitor.
 *   2. Clicking ES persists `NEXT_LOCALE=es` and re-renders ES.
 *   3. Reload still ES with `<html lang="es">`.
 *   4. Privacy page reflects the toggled locale.
 */

test.describe('Locale toggle @smoke', () => {
  test('PT default → ES toggle → reload still ES', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/');
    // PT default — hero CTA is "Crie seu press kit".
    await expect(
      page.getByRole('link', { name: /crie seu press kit/i }),
    ).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');

    // Click ES in the top-bar locale toggle.
    await page
      .locator('header')
      .getByRole('button', { name: 'Español', exact: true })
      .click();
    await expect(
      page.getByRole('link', { name: /crea tu press kit/i }),
    ).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');

    const cookies = await context.cookies();
    expect(cookies.find((c) => c.name === LOCALE_COOKIE_NAME)?.value).toBe('es');

    // Reload — locale persists.
    await page.reload();
    await expect(
      page.getByRole('link', { name: /crea tu press kit/i }),
    ).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  });

  test('legal pages render in the toggled locale', async ({ page, context }) => {
    await context.clearCookies();
    await context.addCookies([
      {
        name: LOCALE_COOKIE_NAME,
        value: 'en',
        domain: 'localhost',
        path: '/',
      },
    ]);
    await page.goto('/privacy');
    await expect(
      page.getByRole('heading', { name: /privacy policy/i, level: 1 }),
    ).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });
});
