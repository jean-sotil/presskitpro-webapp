import type { Access, AccessArgs } from 'payload';

/**
 * Access predicates shared across Payload collections. Three flavors:
 *
 *   - `ownsSelf`           → Users; doc.id must equal req.user.id.
 *   - `ownsProfile`        → Profiles + Media; doc.owner must equal req.user.id.
 *   - `ownsViaProfile`     → ProfileContent / SocialLinks / FeaturedTracks /
 *                            Themes / InstagramConnections; resolves through
 *                            `profile.owner === req.user.id`.
 *
 * For collections with a `profile` relationship, `ownsViaProfile` covers
 * read/update/delete (Payload supports a `Where` filter return). Create
 * is a separate guard, `canCreateForOwnedProfile`, because Payload only
 * accepts boolean for create-time access.
 *
 * Admins (`req.user.collection === 'admins'`) bypass everything.
 */

function isAdmin(user: unknown): boolean {
  return Boolean(
    user &&
      typeof user === 'object' &&
      (user as { collection?: string }).collection === 'admins',
  );
}

export const ownsSelf: Access = ({ req }) => {
  if (!req.user) return false;
  if (isAdmin(req.user)) return true;
  return { id: { equals: (req.user as { id: number | string }).id } };
};

export const ownsProfile: Access = ({ req }) => {
  if (!req.user) return false;
  if (isAdmin(req.user)) return true;
  return { owner: { equals: (req.user as { id: number | string }).id } };
};

export const ownsViaProfile: Access = ({ req }) => {
  if (!req.user) return false;
  if (isAdmin(req.user)) return true;
  return {
    'profile.owner': { equals: (req.user as { id: number | string }).id },
  };
};

export const canCreateForOwnedProfile: Access = async ({
  req,
  data,
}: AccessArgs<{ profile?: number | string | { id: number | string } }>) => {
  if (!req.user) return false;
  if (isAdmin(req.user)) return true;
  const ref = data?.profile;
  if (ref === undefined || ref === null) return false;
  const profileId = typeof ref === 'object' ? ref.id : ref;
  const result = await req.payload.find({
    collection: 'profiles',
    where: {
      and: [
        { id: { equals: profileId } },
        { owner: { equals: (req.user as { id: number | string }).id } },
      ],
    },
    limit: 1,
    depth: 0,
  });
  return result.totalDocs > 0;
};
