import { expect, test } from '@playwright/test';

/**
 * Hero editor E2E (task-10).
 *
 * @smoke covers anonymous redirect (already covered by `editor.spec.ts`'s
 * gate test). The full hero-style toggle ladder is `@full` because it
 * needs an authenticated session + an owned profile id.
 */

test.describe('Hero editor full ladder @full', () => {
  test.skip(
    !process.env.EDITOR_E2E_COOKIE || !process.env.EDITOR_E2E_PROFILE_ID,
    'Set EDITOR_E2E_COOKIE + EDITOR_E2E_PROFILE_ID to run the hero ladder.',
  );

  test('hero style toggle updates the preview + autosaves', async ({ page }) => {
    await page.context().addCookies([
      {
        name: 'sb-session',
        value: process.env.EDITOR_E2E_COOKIE!,
        url: 'http://localhost:3000',
      },
    ]);
    const profileId = process.env.EDITOR_E2E_PROFILE_ID!;

    await page.goto(`/dashboard/profile/${profileId}`);

    // Hero is the first section in the rail; switch to "Lado a lado".
    await page.getByLabel(/lado a lado/i).click();

    // Save status flips pending → idle within 10s.
    await expect(page.locator('[role="status"]', { hasText: /salvando/i })).toBeVisible();
    await expect(
      page.locator('[role="status"]', { hasText: /salvo/i }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('CTA url validation flags an invalid value inline', async ({ page }) => {
    await page.context().addCookies([
      {
        name: 'sb-session',
        value: process.env.EDITOR_E2E_COOKIE!,
        url: 'http://localhost:3000',
      },
    ]);
    const profileId = process.env.EDITOR_E2E_PROFILE_ID!;
    await page.goto(`/dashboard/profile/${profileId}`);
    await page.getByLabel(/url ou contato/i).fill('javascript:alert(1)');
    await expect(
      page.locator('[role="alert"]', { hasText: /url precisa começar/i }),
    ).toBeVisible();
  });
});
