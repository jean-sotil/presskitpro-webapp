import { expect, test } from '@playwright/test';

/**
 * Onboarding wizard E2E.
 *
 * Smoke rung: anonymous redirect to /login. The full happy-path needs
 * a real Supabase magic-link sign-in (the dev-magic-link script gives
 * us one). Gated behind ONBOARDING_E2E_EMAIL env until a session
 * fixture lands; otherwise it'd hammer the live Supabase project on
 * every CI run.
 */

test.describe('Onboarding gate @smoke', () => {
  test('anonymous /onboarding redirects to /login?next=/onboarding', async ({ page }) => {
    await page.goto('/onboarding');
    expect(page.url()).toMatch(/\/login\?next=%2Fonboarding$/);
  });

  test('anonymous /onboarding/3 redirects to /login?next=/onboarding/3', async ({ page }) => {
    await page.goto('/onboarding/3');
    expect(page.url()).toMatch(/\/login\?next=%2Fonboarding%2F3$/);
  });

  test('invalid step (/onboarding/9) renders the not-found page', async ({ page }) => {
    // Logging in via the cookie fixture (when set) so the layout doesn't
    // 302 to /login first; otherwise this skips on @smoke.
    test.skip(
      !process.env.ONBOARDING_E2E_COOKIE,
      'Set ONBOARDING_E2E_COOKIE to a Supabase session cookie for an empty-state user.',
    );
    await page.context().addCookies([
      {
        name: 'sb-session',
        value: process.env.ONBOARDING_E2E_COOKIE!,
        url: 'http://localhost:3000',
      },
    ]);
    await page.goto('/onboarding/9');
    await expect(page.getByText(/passo inválido/i)).toBeVisible();
  });
});

test.describe('Onboarding happy-path @full', () => {
  test.skip(
    !process.env.ONBOARDING_E2E_COOKIE,
    'Set ONBOARDING_E2E_COOKIE to a freshly-minted Supabase session for an empty-state user (no profile, no progress) to run.',
  );

  test('completes the 5 steps and lands on /dashboard/profile/:id', async ({ page }) => {
    await page.context().addCookies([
      {
        name: 'sb-session',
        value: process.env.ONBOARDING_E2E_COOKIE!,
        url: 'http://localhost:3000',
      },
    ]);

    // Step 1 — slug
    const slug = `e2e-${Date.now()}`;
    await page.goto('/onboarding/1');
    await page.getByLabel(/url pública/i).fill(slug);
    await expect(page.getByText(/disponível/i)).toBeVisible();
    await page.getByRole('button', { name: /continuar/i }).click();

    // Step 2 — media (skip)
    await expect(page).toHaveURL(/\/onboarding\/2$/);
    await page.getByRole('button', { name: /pular/i }).click();

    // Step 3 — tagline
    await expect(page).toHaveURL(/\/onboarding\/3$/);
    await page.getByLabel(/tagline/i).fill('House melódico de São Paulo');
    await page.getByRole('button', { name: /continuar/i }).click();

    // Step 4 — services
    await expect(page).toHaveURL(/\/onboarding\/4$/);
    await page.getByText('DJ Set').click();
    await page.getByRole('button', { name: /continuar/i }).click();

    // Step 5 — social + completeWizard
    await expect(page).toHaveURL(/\/onboarding\/5$/);
    await page.getByLabel(/url ou contato/i).fill('https://instagram.com/marianaluz');
    await page.getByRole('button', { name: /concluir/i }).click();

    await page.waitForURL(/\/dashboard\/profile\/\d+$/, { timeout: 10000 });
  });

  test('resume — re-entering /onboarding lands on the next incomplete step', async ({ page }) => {
    test.skip(
      !process.env.ONBOARDING_E2E_PARTIAL_COOKIE,
      'Set ONBOARDING_E2E_PARTIAL_COOKIE to a session whose user has step 2 completed.',
    );
    await page.context().addCookies([
      {
        name: 'sb-session',
        value: process.env.ONBOARDING_E2E_PARTIAL_COOKIE!,
        url: 'http://localhost:3000',
      },
    ]);
    await page.goto('/onboarding');
    await expect(page).toHaveURL(/\/onboarding\/3$/);
  });
});
