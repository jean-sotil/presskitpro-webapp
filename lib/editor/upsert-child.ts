import 'server-only';

import type { PayloadUserDoc } from '../auth/payload-user-from-request';
import { payload as getPayloadInstance } from '../payload';

/**
 * Lazy-creates a 1:1 child collection row (ProfileContent or Themes) and
 * applies a partial update to it. Reused by the content + theme PATCH
 * routes (and any future section task that mutates a child collection).
 *
 * Race posture (R2 in the task plan): if two concurrent requests both
 * find no row and both try to create, the second insert hits a unique
 * constraint on `profile`. We catch that, refetch the row created by the
 * first request, and apply our patch to it. End state is the same.
 */

export type ChildCollectionSlug = 'profile-content' | 'themes';

export async function upsertProfileChild(args: {
  collection: ChildCollectionSlug;
  profileId: number | string;
  data: Record<string, unknown>;
  user: PayloadUserDoc;
  locale?: string;
}): Promise<unknown> {
  const p = await getPayloadInstance();
  const existing = await p.find({
    collection: args.collection,
    where: { profile: { equals: args.profileId } },
    limit: 1,
    depth: 0,
    req: { user: args.user } as never,
  });
  const found = existing.docs[0];
  if (found) {
    return p.update({
      collection: args.collection,
      id: found.id,
      data: args.data,
      ...(args.locale ? { locale: args.locale as 'pt-BR' | 'en' } : {}),
      req: { user: args.user } as never,
    });
  }
  try {
    return await p.create({
      collection: args.collection,
      data: { profile: args.profileId as number, ...args.data },
      ...(args.locale ? { locale: args.locale as 'pt-BR' | 'en' } : {}),
      req: { user: args.user } as never,
    });
  } catch (err) {
    // Concurrent creation race: another request beat us to it. Refetch
    // and patch.
    const second = await p.find({
      collection: args.collection,
      where: { profile: { equals: args.profileId } },
      limit: 1,
      depth: 0,
      req: { user: args.user } as never,
    });
    const winner = second.docs[0];
    if (!winner) throw err;
    return p.update({
      collection: args.collection,
      id: winner.id,
      data: args.data,
      ...(args.locale ? { locale: args.locale as 'pt-BR' | 'en' } : {}),
      req: { user: args.user } as never,
    });
  }
}

/**
 * Verifies the requesting user owns the parent profile. Used by the
 * content + theme PATCH routes BEFORE invoking upsertProfileChild —
 * Payload's child-collection access predicate (`ownsViaProfile`) joins
 * through `profile.owner`, so an upsert on a profile the user doesn't
 * own would otherwise pretend the row doesn't exist (find returns 0)
 * and successfully CREATE a shadow row that the user can't read back.
 * Pre-check stops that.
 */
export async function assertOwnsProfile(args: {
  profileId: number | string;
  user: PayloadUserDoc;
}): Promise<boolean> {
  const p = await getPayloadInstance();
  try {
    const doc = await p.findByID({
      collection: 'profiles',
      id: args.profileId,
      depth: 0,
      req: { user: args.user } as never,
    });
    return Boolean(doc);
  } catch {
    return false;
  }
}
