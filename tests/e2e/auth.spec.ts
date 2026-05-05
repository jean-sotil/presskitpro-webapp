import { expect, test } from '@playwright/test';
import { expectAxeClean } from './fixtures/axe';

test.describe('Auth @smoke', () => {
  test('login page renders, is axe-clean, and shows the email form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /entrar/i })).toBeVisible();
    await expect(page.getByLabel(/e-mail/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /enviar link/i })).toBeVisible();
    await expectAxeClean(page, '/login');
  });

  test('signup page renders and is axe-clean', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.getByRole('heading', { name: /press kit/i })).toBeVisible();
    await expectAxeClean(page, '/signup');
  });

  test('submitting login shows the "check your email" state (network stubbed)', async ({
    page,
  }) => {
    // Stub the Supabase OTP endpoint so the test never hits real Supabase
    // (and never sends a real email).
    await page.route(/\/auth\/v1\/otp/, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      }),
    );

    await page.goto('/login');
    await page.getByLabel(/e-mail/i).fill('test@example.com');
    await page.getByRole('button', { name: /enviar link/i }).click();

    await expect(page.getByText(/confira seu e-mail/i)).toBeVisible();
    await expect(page.getByText('test@example.com')).toBeVisible();
  });

  test('anonymous /dashboard request redirects to /login?next=/dashboard', async ({ page }) => {
    const response = await page.goto('/dashboard');
    expect(page.url()).toMatch(/\/login\?next=%2Fdashboard$/);
    // We followed the redirect, so the final response is the login page (200).
    expect(response?.status()).toBe(200);
  });
});
