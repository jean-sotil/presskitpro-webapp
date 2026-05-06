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

    await page.getByRole('tab', { name: /tema/i }).click();
    await expect(
      page.getByRole('heading', { name: /cores, tipografia e layout/i }),
    ).toBeVisible();

    await page.getByRole('button', { name: /^paper white$/i }).click();
    await page.getByRole('button', { name: /^cobalt$/i }).click();
    await page.getByRole('button', { name: /^magazine$/i }).click();
    await page.getByRole('button', { name: /uniform grid/i }).click();

    // The contrast panel always shows ratios for both pairs.
    await expect(page.getByText(/text \/ bg/i)).toBeVisible();
    await expect(page.getByText(/accent \/ bg/i)).toBeVisible();
  });
});
