import { expect, test } from '@playwright/test';

/**
 * Task-35 PR-C — preset switching from the editor's Design tab.
 *
 * Smoke covers the anonymous redirect (the Design tab lives behind
 * auth). Full ladder requires `EDITOR_E2E_COOKIE` + `EDITOR_E2E_PROFILE_ID`
 * and asserts that clicking a preset card flips the active selection
 * indicator on the Design tab.
 */

test.describe('Design tab @smoke', () => {
  test('anonymous redirect to login still works', async ({ page }) => {
    await page.goto('/dashboard/profile/1');
    expect(page.url()).toMatch(/\/login\?next=/);
  });
});

test.describe('Design tab full ladder @full', () => {
  test.skip(
    !process.env.EDITOR_E2E_COOKIE || !process.env.EDITOR_E2E_PROFILE_ID,
    'Set EDITOR_E2E_COOKIE + EDITOR_E2E_PROFILE_ID.',
  );

  test('renders preset card grid and switches the active preset', async ({ page }) => {
    await page.context().addCookies([
      {
        name: 'sb-session',
        value: process.env.EDITOR_E2E_COOKIE!,
        url: 'http://localhost:3000',
      },
    ]);
    const profileId = process.env.EDITOR_E2E_PROFILE_ID!;
    await page.goto(`/dashboard/profile/${profileId}`);

    await page.getByRole('tab', { name: /design/i }).click();
    await expect(
      page.getByRole('heading', { name: /preset|design/i }),
    ).toBeVisible();

    const mediakit = page.locator('[data-preset-id="mediakit-pro-v1"]');
    const editorial = page.locator('[data-preset-id="editorial-nightlife-v1"]');
    await expect(mediakit).toBeVisible();
    await expect(editorial).toBeVisible();

    // Click the preset that is NOT currently active and confirm the
    // selection indicator flips to it on the next render.
    const initiallyActive = (await mediakit.getAttribute('data-active'))
      ? mediakit
      : editorial;
    const target = initiallyActive === mediakit ? editorial : mediakit;

    await target.getByRole('button', { name: /apply|aplicar/i }).click();
    await expect(target).toHaveAttribute('data-active', 'true');
  });
});
