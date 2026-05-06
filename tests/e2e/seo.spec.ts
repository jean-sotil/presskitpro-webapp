import { expect, test } from '@playwright/test';

/**
 * SEO foundation E2E (task-20). Validates:
 *   - <script type="application/ld+json"> on the public profile.
 *   - /sitemap.xml lists at least the seeded slug.
 *   - /robots.txt allows profiles and disallows /dashboard.
 */

test.describe('SEO foundation @full', () => {
  test('robots.txt disallows the dashboard and points at the sitemap', async ({
    request,
  }) => {
    const res = await request.get('/robots.txt');
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toMatch(/User-Agent:\s*\*/i);
    expect(body).toMatch(/Disallow:\s*\/dashboard\//);
    expect(body).toMatch(/Disallow:\s*\/api\//);
    expect(body).toMatch(/Sitemap:\s*https?:\/\/[^\s]+\/sitemap\.xml/);
  });

  test('sitemap.xml lists at least one URL when a published profile exists', async ({
    request,
  }) => {
    test.skip(
      !process.env.EDITOR_E2E_PROFILE_SLUG,
      'Set EDITOR_E2E_PROFILE_SLUG to a published slug.',
    );
    const slug = process.env.EDITOR_E2E_PROFILE_SLUG!;
    const res = await request.get('/sitemap.xml');
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain(`/${slug}`);
    expect(body).toMatch(/<urlset/);
  });

  test('public profile emits a JSON-LD MusicGroup script', async ({ page }) => {
    test.skip(
      !process.env.EDITOR_E2E_PROFILE_SLUG,
      'Set EDITOR_E2E_PROFILE_SLUG to a published slug.',
    );
    const slug = process.env.EDITOR_E2E_PROFILE_SLUG!;
    await page.goto(`/${slug}`);
    const json = await page.evaluate(() => {
      const el = document.querySelector(
        'script[type="application/ld+json"]',
      ) as HTMLScriptElement | null;
      return el?.textContent ?? null;
    });
    expect(json).toBeTruthy();
    const parsed = JSON.parse(json!);
    expect(parsed['@context']).toBe('https://schema.org');
    expect(parsed['@type']).toBe('MusicGroup');
    expect(parsed.name).toBeTruthy();
  });

  test('canonical URL has no locale prefix', async ({ page }) => {
    test.skip(
      !process.env.EDITOR_E2E_PROFILE_SLUG,
      'Set EDITOR_E2E_PROFILE_SLUG to a published slug.',
    );
    const slug = process.env.EDITOR_E2E_PROFILE_SLUG!;
    await page.goto(`/${slug}`);
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toMatch(new RegExp(`/${slug}$`));
    expect(canonical).not.toMatch(/\/(pt-BR|en)\//);
  });
});
