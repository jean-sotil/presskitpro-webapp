import 'server-only';

import { payload as getPayloadInstance } from '../payload';
import type { PublicBundleDeps, ProfileLite } from './bundle';

/**
 * Production wiring of `PublicBundleDeps`. Mirrors `liveBundleDeps()` but
 * with two key differences:
 *
 *   1. Every Payload call uses `overrideAccess: true` — the visitor isn't
 *      logged in, so no req-level user gates apply. Public access is
 *      controlled here (status === 'published') rather than by the
 *      collection access predicates.
 *
 *   2. Profile lookup is keyed on slug + status; missing or non-published
 *      rows return null so the route's `notFound()` lights up.
 */
export function livePublicBundleDeps(): PublicBundleDeps {
  return {
    async findPublishedProfileBySlug(slug) {
      const p = await getPayloadInstance();
      const result = await p.find({
        collection: 'profiles',
        where: {
          and: [
            { slug: { equals: slug } },
            { status: { equals: 'published' } },
          ],
        },
        limit: 1,
        depth: 1,
        overrideAccess: true,
      });
      const doc = result.docs[0];
      return doc ? (doc as unknown as ProfileLite) : null;
    },

    async findProfileContent(profileId, locale) {
      const p = await getPayloadInstance();
      const result = await p.find({
        collection: 'profile-content',
        where: { profile: { equals: profileId } },
        // Task-29 — pass the active Payload locale so the localized
        // fields (tagline, bio, services) come back in the requested
        // locale. Payload's `fallback: true` returns defaultLocale's
        // values when the requested locale's column is null.
        ...(locale ? { locale: locale as 'pt-BR' | 'en' | 'es' } : {}),
        limit: 1,
        depth: 1,
        overrideAccess: true,
      });
      return (result.docs[0] as never) ?? null;
    },

    async findTheme(profileId) {
      const p = await getPayloadInstance();
      const result = await p.find({
        collection: 'themes',
        where: { profile: { equals: profileId } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      });
      return (result.docs[0] as never) ?? null;
    },

    async findSocialLinks(profileId) {
      const p = await getPayloadInstance();
      const result = await p.find({
        collection: 'social-links',
        where: { profile: { equals: profileId } },
        sort: 'displayOrder',
        limit: 50,
        depth: 0,
        overrideAccess: true,
      });
      return result.docs as never;
    },

    async findFeaturedTrack(profileId) {
      const p = await getPayloadInstance();
      const result = await p.find({
        collection: 'featured-tracks',
        where: { profile: { equals: profileId } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      });
      return (result.docs[0] as never) ?? null;
    },

    async findInstagramPosts(profileId) {
      const p = await getPayloadInstance();
      const result = await p.find({
        collection: 'instagram-posts',
        where: { profile: { equals: profileId } },
        sort: 'displayOrder',
        limit: 6,
        depth: 0,
        overrideAccess: true,
      });
      return result.docs as never;
    },
  };
}
