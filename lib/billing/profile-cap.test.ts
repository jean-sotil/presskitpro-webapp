import { describe, expect, it } from 'vitest';

import {
  PROFILE_CAP_AGENCY,
  PROFILE_CAP_PRO,
  canCreateProfile,
  profileCapForPlan,
} from './profile-cap';

describe('profileCapForPlan', () => {
  it('returns 1 for trial / pro / unknown', () => {
    expect(profileCapForPlan('trial')).toBe(PROFILE_CAP_PRO);
    expect(profileCapForPlan('pro')).toBe(PROFILE_CAP_PRO);
    expect(profileCapForPlan('free')).toBe(PROFILE_CAP_PRO);
    expect(profileCapForPlan('whatever' as never)).toBe(PROFILE_CAP_PRO);
  });

  it('returns 10 for agency', () => {
    expect(profileCapForPlan('agency')).toBe(PROFILE_CAP_AGENCY);
  });
});

describe('canCreateProfile', () => {
  it('blocks unknown / unauthenticated callers', () => {
    expect(canCreateProfile({ plan: null, ownedCount: 0 })).toEqual({
      ok: false,
      reason: 'unauthenticated',
    });
  });

  it('lets a fresh trial user create their first profile', () => {
    expect(canCreateProfile({ plan: 'trial', ownedCount: 0 })).toEqual({
      ok: true,
    });
  });

  it('blocks a trial user who already owns a profile', () => {
    expect(canCreateProfile({ plan: 'trial', ownedCount: 1 })).toEqual({
      ok: false,
      reason: 'cap-reached',
      cap: 1,
    });
  });

  it('blocks a pro user at the same cap as trial', () => {
    expect(canCreateProfile({ plan: 'pro', ownedCount: 1 })).toEqual({
      ok: false,
      reason: 'cap-reached',
      cap: 1,
    });
  });

  it('lets an agency user create up to 10 profiles', () => {
    for (let i = 0; i < 10; i++) {
      expect(canCreateProfile({ plan: 'agency', ownedCount: i })).toEqual({
        ok: true,
      });
    }
  });

  it('blocks the 11th agency profile', () => {
    expect(canCreateProfile({ plan: 'agency', ownedCount: 10 })).toEqual({
      ok: false,
      reason: 'cap-reached',
      cap: 10,
    });
    expect(canCreateProfile({ plan: 'agency', ownedCount: 999 })).toEqual({
      ok: false,
      reason: 'cap-reached',
      cap: 10,
    });
  });

  it('treats the legacy `free` plan label same as `trial`', () => {
    expect(canCreateProfile({ plan: 'free', ownedCount: 0 })).toEqual({
      ok: true,
    });
    expect(canCreateProfile({ plan: 'free', ownedCount: 1 })).toEqual({
      ok: false,
      reason: 'cap-reached',
      cap: 1,
    });
  });
});
