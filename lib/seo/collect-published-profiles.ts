/**
 * DI-shaped sitemap data source. Pages through `payload.find('profiles')`
 * with `status === 'published'` until the result is exhausted.
 *
 * Pure-ish — `find` is the injected Payload-shaped fetcher; the live
 * sitemap route wires `payload.find` and the test stubs it.
 *
 * Per PRD §13 + spec note: don't load all profiles into memory at once
 * for huge counts. Today we accumulate the slugs (~50 chars each) — at
 * 10k profiles that's ~500KB, well under any reasonable Vercel function
 * limit. v2 splits into `/sitemap-N.xml`.
 */

export interface ProfileSitemapEntry {
  slug: string;
  updatedAt: string;
}

export interface CollectDeps {
  find(args: {
    where: { status: { equals: 'published' } };
    limit: number;
    page: number;
    depth: 0;
    sort: 'slug';
  }): Promise<{
    docs: ProfileSitemapEntry[];
    totalPages: number;
    page: number;
  }>;
  pageSize?: number;
}

export async function collectPublishedProfiles(
  deps: CollectDeps,
): Promise<ProfileSitemapEntry[]> {
  const pageSize = deps.pageSize ?? 1000;
  const out: ProfileSitemapEntry[] = [];
  for (let page = 1; ; page++) {
    const result = await deps.find({
      where: { status: { equals: 'published' } },
      limit: pageSize,
      page,
      depth: 0,
      sort: 'slug',
    });
    out.push(...result.docs);
    if (result.docs.length < pageSize) break;
    if (result.totalPages && page >= result.totalPages) break;
  }
  return out;
}
