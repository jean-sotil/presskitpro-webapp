import type { MetadataRoute } from 'next';

import { payload as getPayloadInstance } from '@/lib/payload';
import { collectPublishedProfiles } from '@/lib/seo/collect-published-profiles';

export const dynamic = 'force-dynamic';

const SITE_ORIGIN =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? 'https://presskit.pro';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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

  return rows.map((row) => ({
    url: `${SITE_ORIGIN}/${row.slug}`,
    lastModified: new Date(row.updatedAt),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));
}
