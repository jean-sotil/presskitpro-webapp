import { expect, test } from '@playwright/test';

/**
 * Task-32 — slug-reclaim auth contract.
 *
 *   - `/api/cron/slug-reclaim` POST requires `Authorization: Bearer
 *     <CRON_SECRET>`. 401 otherwise.
 *   - `/api/slug/keep?token=<sig>` GET requires a valid HMAC token
 *     (from the Day-23 warning email). 401 without token; 401 with a
 *     bogus token.
 *
 * Full sweep + email round-trip require seeded data + Resend creds and
 * live in the runbook recipe.
 */

test.describe('Slug reclaim auth @smoke', () => {
  test('cron route returns 401 without bearer token', async ({ request }) => {
    const res = await request.post('/api/cron/slug-reclaim');
    expect(res.status()).toBe(401);
    expect(await res.json()).toEqual({ error: 'unauthorized' });
  });

  test('cron route returns 401 with a wrong bearer token', async ({ request }) => {
    const res = await request.post('/api/cron/slug-reclaim', {
      headers: { authorization: 'Bearer not-the-secret' },
    });
    expect(res.status()).toBe(401);
  });

  test('keep-slug route rejects requests without a token', async ({ request }) => {
    const res = await request.get('/api/slug/keep');
    expect(res.status()).toBe(401);
  });

  test('keep-slug route rejects a malformed token', async ({ request }) => {
    const res = await request.get('/api/slug/keep?token=not-a-real-token');
    expect(res.status()).toBe(401);
  });

  test('keep-slug route rejects a tampered token', async ({ request }) => {
    // base64url-ish payload + bogus signature; valid shape, bad HMAC.
    const res = await request.get(
      '/api/slug/keep?token=aGVsbG8.bm90LXJlYWwtc2lnbmF0dXJl',
    );
    expect(res.status()).toBe(401);
  });
});
