import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { AnalyticsClient } from '@/components/profile/AnalyticsClient';
import { PausedTemplate } from '@/components/profile/PausedTemplate';
import { ProfileRenderer } from '@/components/profile/ProfileRenderer';
import { livePublicBundleDeps } from '@/lib/editor/bundle-public-live';
import { loadPublicBundle } from '@/lib/editor/bundle';
import {
  fromPayloadLocale,
  isSupportedLocale,
  toBcp47,
  toPayloadLocale,
  type SupportedLocale,
} from '@/lib/i18n/locale';
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
    depth: 1,
    overrideAccess: true,
  });
  const doc = result.docs[0] as
    | { owner?: { deletionRequestedAt?: string | null } | number | string | null }
    | undefined;
  if (!doc) return false;
  // Task-33 PR-A — soft-deleted owners 404 even when the profile row
  // is still in the legacy `paused` state. The hard-delete cron will
  // remove the profile entirely in 14 days; until then the public
  // surface is gone.
  const owner = doc.owner;
  if (owner && typeof owner === 'object' && owner.deletionRequestedAt) {
    return false;
  }
  return true;
}

const SITE_ORIGIN =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? 'https://presskit.pro';

// Task-29 PR-B — locale negotiation per request makes the public
// profile dynamic. ISR (revalidate) was a cross-locale cache trap: the
// first render's locale stuck for an hour. Vercel's CDN still caches
// via the middleware's `Cache-Control` header, varying on
// `Accept-Language` + `Cookie` for correctness.
export const dynamic = 'force-dynamic';
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
  const locale = (await getLocale()) as SupportedLocale;
  const bundle = await loadPublicBundle(livePublicBundleDeps(), {
    slug,
    locale: toPayloadLocale(locale),
  });
  if (!bundle) return { title: 'Not found' };
  const baseMeta = buildProfileMetadata(bundle, SITE_ORIGIN, {
    imageUrl: resolveImageUrl(bundle),
  });
  // Task-29 PR-B — emit `<link rel="alternate" hreflang="…">` for every
  // locale the profile has published content in, plus `x-default`.
  const localesAvailable = readLocalesAvailable(bundle.profile as { localesAvailable?: unknown });
  const canonical = `${SITE_ORIGIN}/${slug}`;
  return {
    ...baseMeta,
    alternates: {
      canonical,
      languages: {
        ...Object.fromEntries(
          localesAvailable.map((l) => [toBcp47(l), canonical]),
        ),
        'x-default': canonical,
      },
    },
  };
}

function readLocalesAvailable(profile: { localesAvailable?: unknown }): SupportedLocale[] {
  const raw = profile.localesAvailable;
  if (!Array.isArray(raw)) return ['pt'];
  const seen = new Set<SupportedLocale>();
  for (const item of raw) {
    const short = fromPayloadLocale(String(item));
    if (short) seen.add(short);
  }
  return seen.size > 0 ? [...seen] : ['pt'];
}

export default async function PublicProfilePage({ params }: PageParams) {
  const { slug } = await params;
  const rawLocale = await getLocale();
  const requestedLocale = isSupportedLocale(rawLocale) ? rawLocale : 'pt';
  const bundle = await loadPublicBundle(livePublicBundleDeps(), {
    slug,
    locale: toPayloadLocale(requestedLocale),
  });
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

  // Task-27 — CSP nonce minted in middleware, threaded into the inline
  // theme `<style>` and the JSON-LD `<script>`.
  const nonce = (await headers()).get('x-nonce') ?? undefined;

  // Task-29 PR-B — fallback banner. Show when the requested locale
  // isn't published on this profile; the visitor sees the
  // defaultLocale's content (Payload returns it via `fallback: true`).
  const localesAvailable = readLocalesAvailable(bundle.profile as { localesAvailable?: unknown });
  const profileDefaultLocale =
    fromPayloadLocale(
      String((bundle.profile as { defaultLocale?: string }).defaultLocale ?? 'pt-BR'),
    ) ?? 'pt';
  const showFallbackBanner =
    !localesAvailable.includes(requestedLocale) &&
    requestedLocale !== profileDefaultLocale;
  const t = await getTranslations('profile');

  return (
    <main id="main">
      {/* Trusted: every value is canonicalized server-side. The
          `JSON.stringify` output is the entire script body. */}
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {showFallbackBanner ? (
        <aside
          role="status"
          lang={toBcp47(profileDefaultLocale)}
          className="border-b border-border bg-surface px-6 py-3 text-center text-sm text-text-muted md:px-12"
        >
          {t('fallbackBanner', { language: t(`languageNames.${profileDefaultLocale}`) })}
        </aside>
      ) : null}
      <AnchorNav bundle={bundle} />
      <ProfileRenderer bundle={bundle} mode="public" nonce={nonce} />
      <AnalyticsClient profileSlug={slug} />
    </main>
  );
}
