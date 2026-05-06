import type { MetadataRoute } from 'next';

const SITE_ORIGIN =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? 'https://presskit.pro';

/**
 * `/robots.txt` — public profiles are crawlable; everything app-shell
 * (editor, admin, API, auth pages) is `Disallow`-ed. Sitemap URL is
 * declared so crawlers find it without guessing.
 *
 * Per spec AC: `/dashboard/profile/123` must be Disallow-ed; the
 * `/dashboard/` prefix below covers it.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard/',
        '/admin/',
        '/api/',
        '/onboarding/',
        '/login',
        '/signup',
        '/auth/',
        '/dev/',
        '/spike',
      ],
    },
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
    host: SITE_ORIGIN,
  };
}
