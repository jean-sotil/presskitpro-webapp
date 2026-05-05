import { describe, expect, it, vi } from 'vitest';

import {
  canCreateForOwnedProfile,
  ownsProfile,
  ownsSelf,
  ownsViaProfile,
} from './predicates';

const adminReq = { user: { id: 1, collection: 'admins' } } as never;
const userReq = { user: { id: 42, collection: 'users' } } as never;
const anonReq = { user: null } as never;

describe('ownsSelf (Users)', () => {
  it('denies anonymous', () => {
    expect(ownsSelf({ req: anonReq })).toBe(false);
  });

  it('admins read everything', () => {
    expect(ownsSelf({ req: adminReq })).toBe(true);
  });

  it('users see only their own row (where id === user.id)', () => {
    expect(ownsSelf({ req: userReq })).toEqual({
      id: { equals: 42 },
    });
  });
});

describe('ownsProfile (Profiles, Media via owner field)', () => {
  it('denies anonymous', () => {
    expect(ownsProfile({ req: anonReq })).toBe(false);
  });

  it('admins see everything', () => {
    expect(ownsProfile({ req: adminReq })).toBe(true);
  });

  it('users see only docs they own', () => {
    expect(ownsProfile({ req: userReq })).toEqual({
      owner: { equals: 42 },
    });
  });
});

describe('ownsViaProfile (child collections — joins through `profile.owner`)', () => {
  it('denies anonymous', () => {
    expect(ownsViaProfile({ req: anonReq })).toBe(false);
  });

  it('admins see everything', () => {
    expect(ownsViaProfile({ req: adminReq })).toBe(true);
  });

  it('users see child docs whose parent profile they own', () => {
    expect(ownsViaProfile({ req: userReq })).toEqual({
      'profile.owner': { equals: 42 },
    });
  });
});

describe('canCreateForOwnedProfile (create-time guard for child collections)', () => {
  function makeReq(user: unknown) {
    return {
      user,
      payload: {
        find: vi.fn().mockResolvedValue({ totalDocs: 0, docs: [] }),
      },
    };
  }

  it('denies anonymous', async () => {
    const req = makeReq(null);
    expect(
      await canCreateForOwnedProfile({ req: req as never, data: { profile: 9 } }),
    ).toBe(false);
  });

  it('admins always allowed', async () => {
    const req = makeReq({ id: 1, collection: 'admins' });
    expect(
      await canCreateForOwnedProfile({ req: req as never, data: { profile: 9 } }),
    ).toBe(true);
    expect(req.payload.find).not.toHaveBeenCalled();
  });

  it('denies when no `profile` field on the body', async () => {
    const req = makeReq({ id: 42, collection: 'users' });
    expect(
      await canCreateForOwnedProfile({ req: req as never, data: {} }),
    ).toBe(false);
  });

  it('denies when the referenced profile is owned by someone else', async () => {
    const req = makeReq({ id: 42, collection: 'users' });
    req.payload.find.mockResolvedValueOnce({ totalDocs: 0, docs: [] });
    expect(
      await canCreateForOwnedProfile({ req: req as never, data: { profile: 9 } }),
    ).toBe(false);
    expect(req.payload.find).toHaveBeenCalledWith({
      collection: 'profiles',
      where: {
        and: [{ id: { equals: 9 } }, { owner: { equals: 42 } }],
      },
      limit: 1,
      depth: 0,
    });
  });

  it('allows when the user owns the referenced profile', async () => {
    const req = makeReq({ id: 42, collection: 'users' });
    req.payload.find.mockResolvedValueOnce({ totalDocs: 1, docs: [{ id: 9 }] });
    expect(
      await canCreateForOwnedProfile({ req: req as never, data: { profile: 9 } }),
    ).toBe(true);
  });

  it('handles a relationship object (Payload may pass {id, ...})', async () => {
    const req = makeReq({ id: 42, collection: 'users' });
    req.payload.find.mockResolvedValueOnce({ totalDocs: 1, docs: [{ id: 9 }] });
    expect(
      await canCreateForOwnedProfile({
        req: req as never,
        data: { profile: { id: 9 } },
      }),
    ).toBe(true);
  });
});
