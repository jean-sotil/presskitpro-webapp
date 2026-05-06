import { expect, test } from '@playwright/test';

/**
 * Marketing landing E2E (task-21). The page is RSC + minimal client JS,
 * so this runs without auth. No `@full` skip needed — anyone running
 * the suite locally can hit `/`.
 */

test.describe('Marketing landing', () => {
  test('renders the seven sections + CTA goes to signup', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByRole('heading', { level: 1, name: /press kit em 5 minutos/i }),
    ).toBeVisible();
    await expect(page.getByText(/o que é um press kit/i)).toBeVisible();
    await expect(page.getByText(/como funciona/i)).toBeVisible();
    await expect(page.getByText(/r\$ 19\/mês/i)).toBeVisible();
    await expect(page.getByText(/perguntas frequentes/i)).toBeVisible();

    // CTA → /signup is one tap.
    const cta = page.getByRole('link', { name: /crie seu press kit/i }).first();
    await expect(cta).toHaveAttribute('href', '/signup');
    await cta.click();
    await expect(page).toHaveURL(/\/signup/);
  });

  test('FAQ items expand via the native <details> primitive', async ({ page }) => {
    await page.goto('/');
    const firstSummary = page.getByRole('group').first().locator('summary').first();
    await firstSummary.click();
    // group-open class engages; verify the details element is open.
    const details = firstSummary.locator('xpath=..');
    await expect(details).toHaveAttribute('open', '');
  });
});
