import { expect, test } from '@playwright/test';

/**
 * Read-only checks against /api/slug/check. No DB mutation, so safe to run
 * in CI against the shared dev Supabase project. Each case relies on a
 * permanently-seeded reserved word (PRD §5) or a deterministic format/profanity
 * rule — the result doesn't depend on volatile DB state.
 */
test.describe('/api/slug/check @smoke', () => {
  test('returns available=false reason=reserved for a §5 reserved word', async ({ request }) => {
    const res = await request.get('/api/slug/check?slug=admin');
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({ available: false, reason: 'reserved' });
  });

  test('returns invalid-chars for capitals', async ({ request }) => {
    const res = await request.get('/api/slug/check?slug=BadSlug');
    expect(await res.json()).toEqual({ available: false, reason: 'invalid-chars' });
  });

  test('returns too-short for 1-char input', async ({ request }) => {
    const res = await request.get('/api/slug/check?slug=a');
    expect(await res.json()).toEqual({ available: false, reason: 'too-short' });
  });

  test('returns profane for a profanity hit', async ({ request }) => {
    const res = await request.get('/api/slug/check?slug=fuck-this');
    expect(await res.json()).toEqual({ available: false, reason: 'profane' });
  });

  test('returns available for a clean random slug', async ({ request }) => {
    // Random suffix so the result doesn't depend on whether someone happens
    // to have already reserved this exact value in dev DB.
    const slug = `e2e-clean-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const res = await request.get(`/api/slug/check?slug=${slug}`);
    expect(await res.json()).toEqual({ available: true });
  });
});
