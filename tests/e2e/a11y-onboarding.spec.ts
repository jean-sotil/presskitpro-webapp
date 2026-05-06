import { expect, test } from '@playwright/test';
import { expectAxeClean } from './fixtures/axe';

/**
 * Task-25 — onboarding surface a11y. The wizard steps require auth, so
 * an anonymous request redirects to `/login?next=/onboarding/<step>`.
 * Asserting the redirect target is itself axe-clean catches the
 * documented login-page regression risk.
 */
test.describe('A11y onboarding @smoke', () => {
  for (const step of ['1', '2', '3', '4', '5']) {
    test(`anonymous /onboarding/${step} redirects to login (axe-clean)`, async ({ page }) => {
      await page.goto(`/onboarding/${step}`);
      // Final response is the login page (200). The login view is
      // already axe-checked elsewhere — repeat here so a future
      // redirect-target swap can't silently slip past.
      await expect(page).toHaveURL(/\/login/);
      await expectAxeClean(page, `/onboarding/${step} (redirect)`);
    });
  }
});
