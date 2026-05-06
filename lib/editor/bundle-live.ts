import 'server-only';

import { payload as getPayloadInstance } from '../payload';
import type { PayloadUserDoc } from '../auth/payload-user-from-request';
import type { BundleDeps, ProfileLite } from './bundle';

/**
 * Production wiring of `BundleDeps`: maps the abstract dep contract onto
 * Payload's Local API, passing `req: { user }` so the access predicates
 * from task-08 (`ownsProfile`, `ownsViaProfile`) gate the queries.
 */

export function liveBundleDeps(): BundleDeps {
  return {
    async findProfileById(id, user) {
      const p = await getPayloadInstance();
      try {
        const doc = await p.findByID({
          collection: 'profiles',
          id,
          depth: 1,
          req: { user } as never,
        });
        return doc as unknown as ProfileLite;
      } catch {
        // Payload throws on access-denied / not-found; both surface as 404.
        return null;
      }
    },

    async findProfileContent(profileId, user) {
      const p = await getPayloadInstance();
      const result = await p.find({
        collection: 'profile-content',
        where: { profile: { equals: profileId } },
        limit: 1,
        depth: 1,
        req: { user } as never,
      });
      return (result.docs[0] as never) ?? null;
    },

    async findTheme(profileId, user) {
      const p = await getPayloadInstance();
      const result = await p.find({
        collection: 'themes',
        where: { profile: { equals: profileId } },
        limit: 1,
        depth: 0,
        req: { user } as never,
      });
      return (result.docs[0] as never) ?? null;
    },

    async findSocialLinks(profileId, user) {
      const p = await getPayloadInstance();
      const result = await p.find({
        collection: 'social-links',
        where: { profile: { equals: profileId } },
        sort: 'displayOrder',
        limit: 50,
        depth: 0,
        req: { user } as never,
      });
      return result.docs as never;
    },

    async findFeaturedTrack(profileId, user) {
      const p = await getPayloadInstance();
      const result = await p.find({
        collection: 'featured-tracks',
        where: { profile: { equals: profileId } },
        limit: 1,
        depth: 0,
        req: { user } as never,
      });
      return (result.docs[0] as never) ?? null;
    },

    async findInstagramConnection(profileId, user) {
      const p = await getPayloadInstance();
      const result = await p.find({
        collection: 'instagram-connections',
        where: { profile: { equals: profileId } },
        limit: 1,
        depth: 0,
        req: { user } as never,
      });
      return (result.docs[0] as never) ?? null;
    },

    async findInstagramPosts(profileId, user) {
      const p = await getPayloadInstance();
      const result = await p.find({
        collection: 'instagram-posts',
        where: { profile: { equals: profileId } },
        sort: 'displayOrder',
        limit: 6,
        depth: 0,
        req: { user } as never,
      });
      return result.docs as never;
    },

    async updateProfileStatus({ profileId, status, user }) {
      const p = await getPayloadInstance();
      const doc = await p.update({
        collection: 'profiles',
        id: profileId,
        data: { status },
        req: { user: user as unknown } as never,
      });
      return doc as unknown as ProfileLite;
    },
  };
}

export type _UserParam = PayloadUserDoc; // Keep the import live for downstream callers.
