import { expect, test } from '@playwright/test';

/**
 * Pricing page E2E (task-22). The page is RSC + minimal client JS,
 * so this runs without auth.
 */

test.describe('Pricing page', () => {
  test('renders three tiers, FAQ, and Pro CTA goes through /login when logged out', async ({
    page,
  }) => {
    await page.goto('/pricing');
    await expect(
      page.getByRole('heading', { level: 1, name: /comece grátis/i }),
    ).toBeVisible();

    // Three tier cards.
    await expect(page.getByRole('heading', { level: 2, name: /^trial$/i })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: /^pro$/i })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: /^agency$/i })).toBeVisible();

    // Pro CTA, logged-out → /login?next=/checkout/pro-monthly.
    const proCta = page.getByRole('link', { name: /continuar com pro/i });
    await expect(proCta).toHaveAttribute(
      'href',
      '/login?next=%2Fcheckout%2Fpro-monthly',
    );

    // Trial CTA always points to /signup.
    await expect(page.getByRole('link', { name: /começar grátis/i })).toHaveAttribute(
      'href',
      '/signup',
    );

    // FAQ accordion.
    const firstFaq = page
      .getByText(/posso cancelar a qualquer momento/i)
      .first();
    await expect(firstFaq).toBeVisible();
  });

  test('annual toggle swaps the displayed Pro price', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.getByText('$12').first()).toBeVisible(); // Pro monthly default.
    await page.getByRole('tab', { name: /^anual/i }).click();
    await expect(page.getByText('$10').first()).toBeVisible();
    await expect(page.getByText(/anual em breve/i)).toBeVisible();
  });
});
