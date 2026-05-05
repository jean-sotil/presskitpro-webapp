import { expect, test } from '@playwright/test';

/**
 * Social links editor E2E (task-13). Full-only — needs an authenticated
 * profile.
 */

test.describe('Social links full ladder @full', () => {
  test.skip(
    !process.env.EDITOR_E2E_COOKIE || !process.env.EDITOR_E2E_PROFILE_ID,
    'Set EDITOR_E2E_COOKIE + EDITOR_E2E_PROFILE_ID.',
  );

  test('rail item opens the social-links editor and surfaces validation', async ({ page }) => {
    await page.context().addCookies([
      {
        name: 'sb-session',
        value: process.env.EDITOR_E2E_COOKIE!,
        url: 'http://localhost:3000',
      },
    ]);
    const profileId = process.env.EDITOR_E2E_PROFILE_ID!;
    await page.goto(`/dashboard/profile/${profileId}`);
    await page.getByRole('button', { name: 'Redes sociais' }).click();
    await expect(
      page.getByRole('heading', { level: 2, name: /redes sociais/i }),
    ).toBeVisible();

    // Add a row, type an invalid URL, expect inline error.
    await page.getByRole('button', { name: /adicionar link/i }).click();
    const url = page.getByPlaceholder('@usuario ou URL completa').first();
    await url.fill('not-a-url');
    await expect(page.getByText(/url inválida/i)).toBeVisible();

    // Fix it, error clears.
    await url.fill('@dj_x');
    await expect(page.getByText(/url inválida/i)).toBeHidden();
  });
});
