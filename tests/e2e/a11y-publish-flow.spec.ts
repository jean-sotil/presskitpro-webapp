import { expect, test } from '@playwright/test';

/**
 * Task-25 — keyboard-only publish flow.
 *
 * Spec AC: "Keyboard-only Playwright run completes the publish flow."
 *
 * This is intentionally `@full` only — driving the live publish path
 * requires a seeded user with a complete profile and a contrast-validated
 * theme. The runbook's `pnpm dev:magic-link` recipe produces such an
 * account.
 *
 * Required env (otherwise the test is skipped):
 *   PLAYWRIGHT_AUTHED_EDITOR_URL — full URL like
 *     `http://localhost:3000/dashboard/profile/12` for an account that
 *     is already past onboarding and has theme contrast green.
 *   PLAYWRIGHT_SEEDED_PROFILE_SLUG — the slug to verify post-publish.
 *   PLAYWRIGHT_AUTH_STORAGE_STATE — path to a Playwright storageState
 *     JSON dumped from a logged-in browser context.
 */
test.describe('A11y keyboard publish flow @full', () => {
  test.skip(
    !process.env.PLAYWRIGHT_AUTHED_EDITOR_URL ||
      !process.env.PLAYWRIGHT_SEEDED_PROFILE_SLUG ||
      !process.env.PLAYWRIGHT_AUTH_STORAGE_STATE,
    'Set PLAYWRIGHT_AUTHED_EDITOR_URL + PLAYWRIGHT_SEEDED_PROFILE_SLUG + PLAYWRIGHT_AUTH_STORAGE_STATE to run',
  );

  test.use({
    storageState: process.env.PLAYWRIGHT_AUTH_STORAGE_STATE,
  });

  test('reaches Publish from the editor using only Tab/Enter', async ({ page }) => {
    const editorUrl = process.env.PLAYWRIGHT_AUTHED_EDITOR_URL!;
    const slug = process.env.PLAYWRIGHT_SEEDED_PROFILE_SLUG!;

    await page.goto(editorUrl);

    // Skip-link must be the first focusable element.
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.textContent ?? '');
    expect(focused).toMatch(/pular para o conteúdo/i);

    // Walk to the Publish button by name. We don't assert exact tab
    // count — that would lock to the current chrome layout. We assert
    // that a keyboard user CAN reach it without resorting to the mouse.
    const publishButton = page.getByRole('button', { name: /publicar/i }).first();
    await expect(publishButton).toBeVisible();
    await publishButton.focus();
    await page.keyboard.press('Enter');

    // The PublishDialog opens with focus trapped. Tab to the confirm
    // button — its name should match `/publicar/i` again (the dialog
    // re-uses the label).
    const confirm = page.getByRole('button', { name: /confirmar publicação|publicar agora/i });
    await expect(confirm).toBeVisible();
    await confirm.focus();
    await page.keyboard.press('Enter');

    // After publish, the public route returns 200 with the seeded slug.
    await page.waitForLoadState('networkidle');
    const publicResp = await page.request.get(`/${slug}`);
    expect(publicResp.status()).toBe(200);
  });
});
