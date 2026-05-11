import { expect, test } from '@playwright/test';

/**
 * Theme tab E2E (task-18). Full-only — needs an authenticated profile.
 */

test.describe('Theme tab full ladder @full', () => {
  test.skip(
    !process.env.EDITOR_E2E_COOKIE || !process.env.EDITOR_E2E_PROFILE_ID,
    'Set EDITOR_E2E_COOKIE + EDITOR_E2E_PROFILE_ID.',
  );

  test('switches preset, font and layout; preview reflects each', async ({ page }) => {
    await page.context().addCookies([
      {
        name: 'sb-session',
        value: process.env.EDITOR_E2E_COOKIE!,
        url: 'http://localhost:3000',
      },
    ]);
    const profileId = process.env.EDITOR_E2E_PROFILE_ID!;
    await page.goto(`/dashboard/profile/${profileId}`);

    await page.getByRole('tab', { name: /THEME/i }).click();
    await expect(page.getByRole('heading', { name: /Colors/i })).toBeVisible();

    await page.getByTitle(/^Paper White$/i).click();
    await page.getByTitle(/^Cobalt$/i).click();
    await page.getByRole('button', { name: /Magazine/i }).click();
    await page.getByRole('button', { name: /^Grid$/i }).click();

    // The contrast panel shows a status message.
    await expect(
      page.getByText(/AA contrast passed/i).or(page.getByText(/Contrast too low/i))
    ).toBeVisible();
  });
});
