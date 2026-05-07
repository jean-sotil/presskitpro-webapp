import { expect, test } from '@playwright/test';

/**
 * Task-31 PR-B — pricing CTAs are cycle-aware.
 *
 * Toggling monthly/annual on the pricing page must flip the Pro and
 * Agency CTAs to the matching `/checkout/{plan}-{cycle}` path.
 */

test.describe('Pricing cycle CTAs @smoke', () => {
  test('Pro/Agency CTAs flip when the annual toggle is active', async ({ page }) => {
    await page.goto('/pricing');
    // Monthly default — at least one CTA points at /checkout/pro-monthly.
    const proMonthly = page.getByRole('link', {
      name: /começar|start/i,
    });
    expect(
      (await page.locator('a[href*="/checkout/pro-monthly"]').count()) +
        (await page.locator('a[href*="next=%2Fcheckout%2Fpro-monthly"]').count()),
    ).toBeGreaterThan(0);

    // Click the annual toggle. AnnualToggle uses role="tab".
    const annualBtn = page.getByRole('tab', { name: /anual|annual/i }).first();
    await annualBtn.click();

    // After the click the Pro CTA targets /checkout/pro-annual and the
    // Agency CTA targets /checkout/agency-annual.
    await expect.poll(async () =>
      (await page.locator('a[href*="/checkout/pro-annual"]').count()) +
      (await page.locator('a[href*="next=%2Fcheckout%2Fpro-annual"]').count()),
    ).toBeGreaterThan(0);
    await expect.poll(async () =>
      (await page.locator('a[href*="/checkout/agency-annual"]').count()) +
      (await page.locator('a[href*="next=%2Fcheckout%2Fagency-annual"]').count()),
    ).toBeGreaterThan(0);

    void proMonthly;
  });
});
