import { expect, test } from '@playwright/test';

/**
 * Task-31 PR-A — switch-plan auth contract.
 *
 * `POST /api/billing/switch-plan` is per-user; without a Supabase
 * session cookie it must reject with 401. The full proration path
 * requires Stripe sandbox creds and lives in the runbook recipe.
 */

test.describe('Switch plan auth @smoke', () => {
  test('returns 401 without an auth cookie', async ({ request }) => {
    const res = await request.post('/api/billing/switch-plan', {
      data: { planKey: 'pro-annual' },
    });
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: 'unauthorized' });
  });

  test('returns 401 even when an unauthenticated body is malformed', async ({ request }) => {
    const res = await request.post('/api/billing/switch-plan', {
      data: { foo: 'bar' },
    });
    expect(res.status()).toBe(401);
  });
});
