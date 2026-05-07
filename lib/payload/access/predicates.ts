import type { Access, AccessArgs } from 'payload';

import { canCreateProfile } from '../../billing/profile-cap';

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

/**
 * Profiles-collection create predicate (task-31 PR-B). Enforces the
 * per-plan cap: trial/pro users get 1 profile, agency users get 10.
 *
 * Local-API server actions (`payload.create({ collection: 'profiles', ... })`)
 * bypass this predicate by default — they live behind their own
 * server-side gate. This predicate is defense-in-depth for any
 * REST/GraphQL caller that hits the create endpoint with a session
 * token (e.g. the future agency add-profile flow).
 */
export const canCreateProfileWithCap: Access = async ({ req }) => {
  if (!req.user) return false;
  if (isAdmin(req.user)) return true;
  const userId = (req.user as { id: number | string }).id;
  const userPlan = (req.user as { plan?: string | null }).plan ?? null;
  const owned = await req.payload.find({
    collection: 'profiles',
    where: { owner: { equals: userId } },
    limit: 0,
    pagination: false,
    depth: 0,
  });
  const decision = canCreateProfile({
    plan: userPlan,
    ownedCount: owned.totalDocs,
  });
  return decision.ok;
};
