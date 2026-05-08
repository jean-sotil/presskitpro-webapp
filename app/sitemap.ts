import type { MetadataRoute } from 'next';

import { payload as getPayloadInstance } from '@/lib/payload';
import { collectPublishedProfiles } from '@/lib/seo/collect-published-profiles';

export const dynamic = 'force-dynamic';

const SITE_ORIGIN =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? 'https://presskit.pro';

/**
 * Static marketing routes — homepage + commercial + legal. Listed first
 * so crawlers find canonical entrypoints before paging through user-
 * generated profiles. Locale variants share the same URL (cookie-driven
 * negotiation) so each entry has one row and per-page metadata declares
 * the hreflang fan-out via `alternates.languages`.
 */
const STATIC_ROUTES: MetadataRoute.Sitemap = [
  { url: `${SITE_ORIGIN}/`,        changeFrequency: 'weekly',  priority: 1.0 },
  { url: `${SITE_ORIGIN}/pricing`, changeFrequency: 'monthly', priority: 0.8 },
  { url: `${SITE_ORIGIN}/privacy`, changeFrequency: 'yearly',  priority: 0.3 },
  { url: `${SITE_ORIGIN}/terms`,   changeFrequency: 'yearly',  priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticEntries = STATIC_ROUTES.map((entry) => ({ ...entry, lastModified: now }));

  const p = await getPayloadInstance();
  const rows = await collectPublishedProfiles({
    async find(args) {
      const result = await p.find({
        collection: 'profiles',
        where: args.where,
        limit: args.limit,
        page: args.page,
        depth: args.depth,
        sort: args.sort,
        overrideAccess: true,
      });
      return {
        docs: result.docs.map((d) => ({
          slug: String((d as { slug: string }).slug),
          updatedAt: String(
            (d as { updatedAt?: string }).updatedAt ?? new Date(0).toISOString(),
          ),
        })),
        totalPages: result.totalPages,
        page: result.page ?? 1,
      };
    },
  });

  const profileEntries: MetadataRoute.Sitemap = rows.map((row) => ({
    url: `${SITE_ORIGIN}/${row.slug}`,
    lastModified: new Date(row.updatedAt),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...staticEntries, ...profileEntries];
}
