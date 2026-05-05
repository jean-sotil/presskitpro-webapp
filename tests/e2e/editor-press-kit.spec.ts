import { expect, test } from '@playwright/test';

/**
 * Press-kit editor E2E (task-15). Full-only — needs an authenticated
 * profile + network access to whatever URL we paste in.
 */

test.describe('Press kit full ladder @full', () => {
  test.skip(
    !process.env.EDITOR_E2E_COOKIE || !process.env.EDITOR_E2E_PROFILE_ID,
    'Set EDITOR_E2E_COOKIE + EDITOR_E2E_PROFILE_ID.',
  );

  test('rail item opens the press-kit editor and validates URLs', async ({ page }) => {
    await page.context().addCookies([
      {
        name: 'sb-session',
        value: process.env.EDITOR_E2E_COOKIE!,
        url: 'http://localhost:3000',
      },
    ]);
    const profileId = process.env.EDITOR_E2E_PROFILE_ID!;
    await page.goto(`/dashboard/profile/${profileId}`);
    await page.getByRole('button', { name: 'Press kit' }).click();
    await expect(
      page.getByRole('heading', { level: 2, name: /^press kit$/i }),
    ).toBeVisible();

    // Bad URL → inline error, no save.
    const input = page.getByLabel(/url do press kit/i);
    await input.fill('https://example.com/this-does-not-exist-please');
    await page.getByRole('button', { name: /validar/i }).click();
    await expect(page.getByRole('alert')).toBeVisible();

    // Valid URL → green badge, autosave fires.
    await input.fill('https://www.dropbox.com/scl/fi/example/kit.zip');
    await page.getByRole('button', { name: /validar/i }).click();
    await expect(page.getByText(/link válido/i)).toBeVisible();
  });
});
