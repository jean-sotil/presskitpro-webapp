import { expect, test } from '@playwright/test';

import {
  CONSENT_COOKIE_NAME,
  CONSENT_COOKIE_VALUE,
} from '@/lib/consent/cookie-consent';

/**
 * Task-27 PR-2 — legal routes + cookie consent banner.
 *
 * Asserts:
 *   1. `/privacy` and `/terms` resolve with 200 and the expected H1.
 *   2. The banner renders for first-time visitors and disappears once
 *      the consent cookie is set.
 */

test.describe('Legal pages @smoke', () => {
  test('renders /privacy with the policy heading', async ({ page }) => {
    await page.goto('/privacy');
    await expect(
      page.getByRole('heading', { name: /política de privacidade/i, level: 1 }),
    ).toBeVisible();
  });

  test('renders /terms with the terms heading', async ({ page }) => {
    await page.goto('/terms');
    await expect(
      page.getByRole('heading', { name: /termos de uso/i, level: 1 }),
    ).toBeVisible();
  });
});

test.describe('Cookie consent banner @smoke', () => {
  test('appears for first-time visitors and dismisses on accept', async ({
    page,
    context,
  }) => {
    // Wipe cookies so the banner appears in a clean state.
    await context.clearCookies();
    await page.goto('/');
    const banner = page.getByTestId(CONSENT_COOKIE_NAME);
    await expect(banner).toBeVisible();
    await banner.getByRole('button', { name: /entendido/i }).click();
    await expect(banner).toBeHidden();
    const cookies = await context.cookies();
    const set = cookies.find((c) => c.name === CONSENT_COOKIE_NAME);
    expect(set?.value).toBe(CONSENT_COOKIE_VALUE);
  });

  test('does not render when the consent cookie is already set', async ({
    page,
    context,
  }) => {
    await context.addCookies([
      {
        name: CONSENT_COOKIE_NAME,
        value: CONSENT_COOKIE_VALUE,
        domain: 'localhost',
        path: '/',
      },
    ]);
    await page.goto('/');
    await expect(page.getByTestId(CONSENT_COOKIE_NAME)).toHaveCount(0);
  });
});
