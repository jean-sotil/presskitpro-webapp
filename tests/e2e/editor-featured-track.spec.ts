import { expect, test } from '@playwright/test';

/**
 * Featured-track editor E2E (task-16). Full-only — needs an authenticated
 * profile + outbound network access to soundcloud.com.
 */

test.describe('Featured track full ladder @full', () => {
  test.skip(
    !process.env.EDITOR_E2E_COOKIE || !process.env.EDITOR_E2E_PROFILE_ID,
    'Set EDITOR_E2E_COOKIE + EDITOR_E2E_PROFILE_ID.',
  );

  test('rail item opens the editor and saves a track', async ({ page }) => {
    await page.context().addCookies([
      {
        name: 'sb-session',
        value: process.env.EDITOR_E2E_COOKIE!,
        url: 'http://localhost:3000',
      },
    ]);
    const profileId = process.env.EDITOR_E2E_PROFILE_ID!;
    await page.goto(`/dashboard/profile/${profileId}`);
    await page.getByRole('button', { name: 'Faixa em destaque' }).click();
    await expect(
      page.getByRole('heading', { level: 2, name: /^faixa em destaque$/i }),
    ).toBeVisible();

    // Paste a public SoundCloud URL → save → preview iframe appears.
    await page.getByLabel(/url do soundcloud/i).fill(
      'https://soundcloud.com/forss/flickermood',
    );
    await page.getByRole('button', { name: /^salvar$/i }).click();
    await expect(page.locator('iframe[src*="w.soundcloud.com"]').first()).toBeVisible({
      timeout: 5_000,
    });
  });
});
