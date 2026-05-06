import { expect, test } from '@playwright/test';

/**
 * Instagram editor E2E (task-17). Full-only — needs an authenticated profile.
 * Works without `INSTAGRAM_OEMBED_ACCESS_TOKEN` because the route falls back
 * to the blockquote builder when the token is unset.
 */

test.describe('Instagram full ladder @full', () => {
  test.skip(
    !process.env.EDITOR_E2E_COOKIE || !process.env.EDITOR_E2E_PROFILE_ID,
    'Set EDITOR_E2E_COOKIE + EDITOR_E2E_PROFILE_ID.',
  );

  test('rail item opens the editor and saves a single post', async ({ page }) => {
    await page.context().addCookies([
      {
        name: 'sb-session',
        value: process.env.EDITOR_E2E_COOKIE!,
        url: 'http://localhost:3000',
      },
    ]);
    const profileId = process.env.EDITOR_E2E_PROFILE_ID!;
    await page.goto(`/dashboard/profile/${profileId}`);
    await page.getByRole('button', { name: 'Instagram' }).click();
    await expect(
      page.getByRole('heading', { level: 2, name: /^instagram$/i }),
    ).toBeVisible();

    await page.getByRole('button', { name: /adicionar post/i }).click();
    await page
      .getByLabel(/url do post #1/i)
      .fill('https://www.instagram.com/p/CxYzAbc123/');
    await page.getByRole('button', { name: /^salvar$/i }).click();

    // Either a blockquote (fallback) or an iframe (graph) shows up in the preview pane.
    await expect(
      page.locator('blockquote.instagram-media, iframe[src*="instagram.com"]').first(),
    ).toBeVisible({ timeout: 5_000 });
  });
});
