import { expect, test } from '@playwright/test';

/**
 * Photo gallery editor E2E (task-12). Full-only — needs an authenticated
 * profile with the gallery field migrated.
 */

test.describe('Photo gallery full ladder @full', () => {
  test.skip(
    !process.env.EDITOR_E2E_COOKIE || !process.env.EDITOR_E2E_PROFILE_ID,
    'Set EDITOR_E2E_COOKIE + EDITOR_E2E_PROFILE_ID.',
  );

  test('rail item opens the gallery editor', async ({ page }) => {
    await page.context().addCookies([
      {
        name: 'sb-session',
        value: process.env.EDITOR_E2E_COOKIE!,
        url: 'http://localhost:3000',
      },
    ]);
    const profileId = process.env.EDITOR_E2E_PROFILE_ID!;
    await page.goto(`/dashboard/profile/${profileId}`);
    await page.getByRole('button', { name: 'Galeria' }).click();
    await expect(page.getByRole('heading', { name: /galeria de fotos/i })).toBeVisible();
    await expect(page.getByText(/arraste ou clique/i)).toBeVisible();
  });
});
