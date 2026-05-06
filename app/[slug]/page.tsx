import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ProfileRenderer } from '@/components/profile/ProfileRenderer';
import { livePublicBundleDeps } from '@/lib/editor/bundle-public-live';
import { loadPublicBundle } from '@/lib/editor/bundle';
import { mediaUrl } from '@/lib/media/url';
import { buildProfileJsonLd } from '@/lib/seo/build-profile-jsonld';
import { buildProfileMetadata } from '@/lib/seo/build-profile-metadata';

import { AnchorNav } from './AnchorNav';

const SITE_ORIGIN =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? 'https://presskit.pro';

// ISR: re-render on demand (the Profiles afterChange hook calls
// `revalidatePath('/<slug>')` whenever a published row changes).
// `revalidate: 3600` is a belt-and-braces hourly fallback so even if a
// revalidate trigger is missed, freshness is bounded.
export const revalidate = 3600;
export const dynamicParams = true;

interface PageParams {
  params: Promise<{ slug: string }>;
}

function resolveImageUrl(bundle: ReturnType<typeof Object.assign>): string | undefined {
  // Order: profile-content `ogImage` > profile `portrait`. Both go
  // through `mediaUrl` which expects `{ bucket, path }`. Returns
  // undefined if neither is present (Twitter falls back to summary).
  const content = (bundle.content ?? null) as
    | { ogImage?: { bucket?: string; path?: string } | null }
    | null;
  const portrait = bundle.profile.portrait as
    | { bucket?: string; path?: string }
    | null;
  const og = content?.ogImage ?? portrait ?? null;
  if (!og?.bucket || !og?.path) return undefined;
  return mediaUrl({ bucket: og.bucket, path: og.path }) ?? undefined;
}

/** SEO metadata. Same lookup as the page render — Payload caches the
 *  Local API call across the two so this isn't a double round-trip in
 *  practice. */
export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { slug } = await params;
  const bundle = await loadPublicBundle(livePublicBundleDeps(), { slug });
  if (!bundle) return { title: 'Not found' };
  return buildProfileMetadata(bundle, SITE_ORIGIN, {
    imageUrl: resolveImageUrl(bundle),
  });
}

export default async function PublicProfilePage({ params }: PageParams) {
  const { slug } = await params;
  const bundle = await loadPublicBundle(livePublicBundleDeps(), { slug });
  // `null` covers both "no such slug" and "slug exists but isn't published"
  // (and, by extension, paused — task-31 will branch out a paused page).
  if (!bundle) notFound();

  const jsonLd = buildProfileJsonLd(bundle, SITE_ORIGIN, {
    imageUrl: resolveImageUrl(bundle),
  });

  return (
    <main>
      {/* Trusted: every value is canonicalized server-side. The
          `JSON.stringify` output is the entire script body. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AnchorNav bundle={bundle} />
      <ProfileRenderer bundle={bundle} mode="public" />
    </main>
  );
}
