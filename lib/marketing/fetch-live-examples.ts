/**
 * Pure DI loader for the marketing landing's "live examples" carousel.
 * Returns a minimal projection — slug + displayName + portrait — so the
 * marketing page never carries a full bundle.
 *
 * Live wiring lives in `app/page.tsx`; tests inject `find`.
 */

const MAX_LIMIT = 16;

export interface LiveExample {
  slug: string;
  displayName: string;
  portrait: { bucket: string; path: string; alt?: string } | null;
}

interface RawProfile {
  slug: string;
  portrait?: { bucket?: string; path?: string; alt?: string } | null;
}

export interface LoadLiveExamplesDeps {
  find(args: {
    where: { status: { equals: 'published' } };
    sort: '-updatedAt';
    limit: number;
    depth: 1;
    overrideAccess: true;
  }): Promise<{ docs: RawProfile[] }>;
  limit: number;
}

export async function loadLiveExamples(
  deps: LoadLiveExamplesDeps,
): Promise<LiveExample[]> {
  const limit = Math.min(Math.max(1, deps.limit), MAX_LIMIT);
  const result = await deps.find({
    where: { status: { equals: 'published' } },
    sort: '-updatedAt',
    limit,
    depth: 1,
    overrideAccess: true,
  });
  return result.docs.map((doc) => {
    const portrait = doc.portrait
      ? doc.portrait.bucket && doc.portrait.path
        ? {
            bucket: String(doc.portrait.bucket),
            path: String(doc.portrait.path),
            alt: doc.portrait.alt,
          }
        : null
      : null;
    return {
      slug: doc.slug,
      displayName: doc.slug.replace(/-/g, ' '),
      portrait,
    };
  });
}
