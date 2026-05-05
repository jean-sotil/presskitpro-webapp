import { expect, test } from '@playwright/test';

/**
 * Contact editor E2E (task-14). Full-only — needs an authenticated
 * profile.
 */

test.describe('Contact full ladder @full', () => {
  test.skip(
    !process.env.EDITOR_E2E_COOKIE || !process.env.EDITOR_E2E_PROFILE_ID,
    'Set EDITOR_E2E_COOKIE + EDITOR_E2E_PROFILE_ID.',
  );

  test('rail item opens the contact editor and reveals the destination input', async ({
    page,
  }) => {
    await page.context().addCookies([
      {
        name: 'sb-session',
        value: process.env.EDITOR_E2E_COOKIE!,
        url: 'http://localhost:3000',
      },
    ]);
    const profileId = process.env.EDITOR_E2E_PROFILE_ID!;
    await page.goto(`/dashboard/profile/${profileId}`);
    await page.getByRole('button', { name: 'Contato' }).click();
    await expect(
      page.getByRole('heading', { level: 2, name: /^contato$/i }),
    ).toBeVisible();

    // Toggle the form on; destination input appears.
    await page.getByLabel(/ativar formulário/i).check();
    await expect(page.getByLabel(/destino das mensagens/i)).toBeVisible();
  });
});
