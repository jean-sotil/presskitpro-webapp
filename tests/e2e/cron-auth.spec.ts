import { expect, test } from '@playwright/test';

/**
 * Task-30 — cron auth contract.
 *
 * The press-kit health-check cron lives at
 * `POST /api/cron/press-kit-health` and rejects any request without a
 * matching `Authorization: Bearer <CRON_SECRET>` with 401.
 *
 * The smoke tier exercises only the auth posture; the full sweep
 * requires real published profiles + Resend creds and lives in a
 * runbook recipe.
 */

test.describe('Cron auth @smoke', () => {
  test('press-kit-health route returns 401 without bearer token', async ({
    request,
  }) => {
    const res = await request.post('/api/cron/press-kit-health');
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: 'unauthorized' });
  });

  test('press-kit-health route returns 401 with a wrong bearer token', async ({
    request,
  }) => {
    const res = await request.post('/api/cron/press-kit-health', {
      headers: { authorization: 'Bearer not-the-secret' },
    });
    expect(res.status()).toBe(401);
  });
});
