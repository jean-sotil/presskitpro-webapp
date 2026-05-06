import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PausedTemplate } from '@/components/profile/PausedTemplate';
import { ProfileRenderer } from '@/components/profile/ProfileRenderer';
import { livePublicBundleDeps } from '@/lib/editor/bundle-public-live';
import { loadPublicBundle } from '@/lib/editor/bundle';
import { mediaUrl } from '@/lib/media/url';
import { payload } from '@/lib/payload';
import { buildProfileJsonLd } from '@/lib/seo/build-profile-jsonld';
import { buildProfileMetadata } from '@/lib/seo/build-profile-metadata';

import { AnchorNav } from './AnchorNav';

async function findPausedProfileBySlug(slug: string): Promise<boolean> {
  const p = await payload();
  const result = await p.find({
    collection: 'profiles',
    where: {
      and: [
        { slug: { equals: slug } },
        { status: { equals: 'paused' } },
      ],
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  return result.totalDocs > 0;
}

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
  if (!bundle) {
    // Branch: paused profiles render a branded "Press kit pausado"
    // page at HTTP 200 (PRD §16) — not a 404 — so inbound links keep
    // resolving until the Day-90 cron releases the slug.
    if (await findPausedProfileBySlug(slug)) {
      return <PausedTemplate slug={slug} />;
    }
    notFound();
  }

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
