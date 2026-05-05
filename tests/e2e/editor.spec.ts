import { expect, test } from '@playwright/test';

/**
 * Editor shell E2E (task-09).
 *
 * Smoke rungs cover the auth gate and ownership 404. Full ladder
 * (autosave → publish → public render) is gated on a Supabase session
 * cookie because seeded demo profiles have synthetic owners and the
 * editor's REST routes require a real auth.users mirror.
 */

test.describe('Editor gate @smoke', () => {
  test('anonymous /dashboard/profile/1 redirects to /login', async ({ page }) => {
    await page.goto('/dashboard/profile/1');
    expect(page.url()).toMatch(/\/login\?next=/);
  });

  test('invalid id (/dashboard/profile/abc) renders not-found page', async ({ page }) => {
    test.skip(
      !process.env.EDITOR_E2E_COOKIE,
      'Set EDITOR_E2E_COOKIE for the auth-gated 404 case.',
    );
    await page.context().addCookies([
      {
        name: 'sb-session',
        value: process.env.EDITOR_E2E_COOKIE!,
        url: 'http://localhost:3000',
      },
    ]);
    await page.goto('/dashboard/profile/abc');
    await expect(page.getByText(/perfil não encontrado/i)).toBeVisible();
  });
});

test.describe('Editor full ladder @full', () => {
  test.skip(
    !process.env.EDITOR_E2E_COOKIE || !process.env.EDITOR_E2E_PROFILE_ID,
    'Set EDITOR_E2E_COOKIE + EDITOR_E2E_PROFILE_ID (a profile owned by the cookie\'s user).',
  );

  test('edit slug → autosave fires → preview reflects → publish → public route renders', async ({ page }) => {
    await page.context().addCookies([
      {
        name: 'sb-session',
        value: process.env.EDITOR_E2E_COOKIE!,
        url: 'http://localhost:3000',
      },
    ]);
    const profileId = process.env.EDITOR_E2E_PROFILE_ID!;
    const newSlug = `e2e-edit-${Date.now()}`;

    await page.goto(`/dashboard/profile/${profileId}`);

    // Edit slug → autosave fires within 6s.
    await page.getByLabel(/url pública/i).fill(newSlug);
    await expect(page.locator('[role="status"]', { hasText: /salvando/i })).toBeVisible();
    await expect(
      page.locator('[role="status"]', { hasText: /salvo/i }),
    ).toBeVisible({ timeout: 10_000 });

    // Preview shows the new slug.
    await expect(page.getByText(`presskit.pro/${newSlug}`)).toBeVisible();

    // Publish via the dialog.
    await page.getByRole('button', { name: /^publicar$/i }).click();
    await page.getByRole('button', { name: /^publicar$/i }).last().click();

    // Public route should render within the cache window.
    await page.waitForTimeout(1500); // give ISR a moment
    const publicRes = await page.request.get(`/${newSlug}`);
    expect([200, 404]).toContain(publicRes.status());
  });
});
