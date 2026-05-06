import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ProfileRenderer } from '@/components/profile/ProfileRenderer';
import { livePublicBundleDeps } from '@/lib/editor/bundle-public-live';
import { loadPublicBundle } from '@/lib/editor/bundle';
import { mediaUrl } from '@/lib/media/url';

import { AnchorNav } from './AnchorNav';

// ISR: re-render on demand (the Profiles afterChange hook calls
// `revalidatePath('/<slug>')` whenever a published row changes).
// `revalidate: 3600` is a belt-and-braces hourly fallback so even if a
// revalidate trigger is missed, freshness is bounded.
export const revalidate = 3600;
export const dynamicParams = true;

interface PageParams {
  params: Promise<{ slug: string }>;
}

/** SEO metadata. Same lookup as the page render — Payload caches the
 *  Local API call across the two so this isn't a double round-trip in
 *  practice. */
export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { slug } = await params;
  const bundle = await loadPublicBundle(livePublicBundleDeps(), { slug });
  if (!bundle) return { title: 'Not found' };

  const profile = bundle.profile;
  const content = bundle.content as
    | {
        tagline?: string | null;
        metaTitle?: string | null;
        metaDescription?: string | null;
        ogImage?: { bucket?: string; path?: string } | null;
      }
    | null;
  const displayName = String(profile.slug ?? '').replace(/-/g, ' ');
  const tagline = content?.tagline ?? '';
  const portrait = profile.portrait as { bucket?: string; path?: string } | null;
  const og = content?.ogImage ?? portrait ?? null;
  const ogUrl = og?.bucket && og?.path ? mediaUrl({ bucket: og.bucket, path: og.path }) : null;

  return {
    title: content?.metaTitle ?? (tagline ? `${displayName} — ${tagline}` : displayName),
    description: content?.metaDescription ?? tagline ?? undefined,
    openGraph: ogUrl
      ? {
          title: content?.metaTitle ?? displayName,
          description: content?.metaDescription ?? tagline ?? undefined,
          images: [{ url: ogUrl }],
          type: 'profile',
        }
      : undefined,
    // Vary on Accept-Language for future locale-toggle (task-29).
    // Next's metadata API doesn't expose arbitrary response headers, so
    // the middleware appends it. This `other` block is informational
    // only; remove if/when Next supports it natively.
    other: {
      'x-presskit-slug': profile.slug,
    },
  };
}

export default async function PublicProfilePage({ params }: PageParams) {
  const { slug } = await params;
  const bundle = await loadPublicBundle(livePublicBundleDeps(), { slug });
  // `null` covers both "no such slug" and "slug exists but isn't published"
  // (and, by extension, paused — task-31 will branch out a paused page).
  if (!bundle) notFound();

  return (
    <main>
      <AnchorNav bundle={bundle} />
      <ProfileRenderer bundle={bundle} mode="public" />
    </main>
  );
}
