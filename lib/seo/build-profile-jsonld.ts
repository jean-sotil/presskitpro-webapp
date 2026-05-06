/**
 * Pure builder for the JSON-LD `MusicGroup` payload that the public
 * profile page emits in a `<script type="application/ld+json">`.
 *
 * Defaults to `MusicGroup` (covers DJs/bands/duos). The schema doesn't
 * have a "lone artist" toggle yet — when it does, branch here on the
 * profile field and emit `Person` instead. No other call site changes.
 *
 * `sameAs` aggregates every external URL we already trust (social
 * links, featured track, press kit). All values come from canonical
 * forms produced by tasks 13/15/16 — no extra sanitization needed.
 */

import type { EditorBundle } from '@/lib/editor/bundle';

export interface ProfileJsonLd {
  '@context': 'https://schema.org';
  '@type': 'MusicGroup';
  name: string;
  url: string;
  description?: string;
  image?: string;
  sameAs?: string[];
}

export interface BuildJsonLdOptions {
  /** Pre-resolved image URL (e.g. `mediaUrl(portrait)`). The helper
   *  doesn't reach into Supabase Storage itself; the caller passes a
   *  full URL or omits. */
  imageUrl?: string;
}

export function buildProfileJsonLd(
  bundle: EditorBundle,
  origin: string,
  options: BuildJsonLdOptions = {},
): ProfileJsonLd {
  const profile = bundle.profile as {
    slug: string;
    pressKitUrl?: string;
  };
  const content = bundle.content as
    | { metaTitle?: string; metaDescription?: string; tagline?: string }
    | null;

  const displayName = content?.metaTitle?.trim() || displayFromSlug(profile.slug);
  const url = `${origin.replace(/\/$/, '')}/${profile.slug}`;

  const description =
    content?.metaDescription?.trim() || content?.tagline?.trim() || undefined;

  const sameAs = collectSameAs(bundle, profile.pressKitUrl);

  const ld: ProfileJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MusicGroup',
    name: displayName,
    url,
  };
  if (description) ld.description = description;
  if (options.imageUrl) ld.image = options.imageUrl;
  if (sameAs.length > 0) ld.sameAs = sameAs;
  return ld;
}

function displayFromSlug(slug: string): string {
  return slug.replace(/-/g, ' ');
}

function collectSameAs(
  bundle: EditorBundle,
  pressKitUrl?: string,
): string[] {
  const out: string[] = [];
  for (const link of bundle.socialLinks as Array<{ url?: string }>) {
    if (typeof link.url === 'string' && link.url.trim().length > 0) {
      out.push(link.url);
    }
  }
  const trackUrl = (bundle.featuredTrack as { url?: string } | null)?.url;
  if (typeof trackUrl === 'string' && trackUrl.trim().length > 0) {
    out.push(trackUrl);
  }
  if (typeof pressKitUrl === 'string' && pressKitUrl.trim().length > 0) {
    out.push(pressKitUrl);
  }
  // De-dup, preserve order.
  const seen = new Set<string>();
  return out.filter((u) => {
    if (seen.has(u)) return false;
    seen.add(u);
    return true;
  });
}
