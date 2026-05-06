import { expect, test } from '@playwright/test';

/**
 * Task-23 — checkout flow.
 *
 * The live Stripe redirect is gated behind `STRIPE_SECRET_KEY`; the
 * `@full` happy-path test only fires with real credentials. The smoke
 * tests here run on every CI tick — they verify the public surface
 * (canceled / success pages render, anonymous /checkout redirects to
 * login) without needing Stripe to be configured.
 */

test.describe('Checkout flow @smoke', () => {
  test('anonymous /checkout/pro-monthly redirects to login with next param', async ({ page }) => {
    const response = await page.goto('/checkout/pro-monthly');
    expect(page.url()).toMatch(/\/login\?next=%2Fcheckout%2Fpro-monthly$/);
    expect(response?.status()).toBe(200);
  });

  test('/checkout/canceled renders the recovery page', async ({ page }) => {
    await page.goto('/checkout/canceled');
    await expect(
      page.getByRole('heading', { name: /sem cobrança/i }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: /ver planos/i })).toBeVisible();
  });

  test('/checkout/success renders the activated state', async ({ page }) => {
    await page.goto('/checkout/success');
    await expect(
      page.getByRole('heading', { name: /seu plano está ativo/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /ir para o painel/i }),
    ).toBeVisible();
  });
});

test.describe('Checkout flow @full', () => {
  // Requires STRIPE_SECRET_KEY — full e2e only.
  test.skip(
    !process.env.STRIPE_SECRET_KEY,
    'STRIPE_SECRET_KEY not set — skipping live checkout test',
  );

  test('confirmation card renders with the chosen plan label', async ({ page }) => {
    // Logged-in seed-user happy path. Until we have a fixture-account
    // helper, this test is a placeholder — it documents the surface so
    // task-31 can extend it with annual + agency cases without touching
    // the harness.
    await page.goto('/checkout/pro-monthly');
    await expect(page.getByRole('heading', { name: /pro/i })).toBeVisible();
    await expect(
      page.getByRole('button', { name: /continuar para o checkout/i }),
    ).toBeVisible();
  });
});
