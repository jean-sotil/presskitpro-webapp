import { describe, expect, it, vi } from 'vitest';

import {
  advanceStepImpl,
  cancelWizardImpl,
  completeWizardImpl,
  type WizardDeps,
} from './actions-impl';
import { CURATED_SERVICES } from './state';

function makeDeps(overrides: Partial<WizardDeps> = {}): WizardDeps {
  return {
    getSupabaseUser: vi.fn().mockResolvedValue({ id: 'sb-user-1', email: 'a@b.com' }),
    getPayloadUser: vi.fn().mockResolvedValue({
      id: 42,
      supabaseUserId: 'sb-user-1',
      onboardingProgress: null,
    }),
    saveProgress: vi.fn().mockResolvedValue(undefined),
    findExistingProfile: vi.fn().mockResolvedValue(null),
    reserveSlug: vi.fn().mockResolvedValue(undefined),
    releaseSlug: vi.fn().mockResolvedValue(undefined),
    createProfileBundle: vi
      .fn()
      .mockResolvedValue({ id: 99 }),
    track: vi.fn(),
    ...overrides,
  };
}

// =============================================================
// advanceStep
// =============================================================

describe('advanceStepImpl', () => {
  it('returns auth-required when no Supabase session', async () => {
    const deps = makeDeps({
      getSupabaseUser: vi.fn().mockResolvedValue(null),
    });
    const r = await advanceStepImpl(deps, { step: 1, data: { slug: 'mariana' } });
    expect(r).toEqual({ ok: false, reason: 'auth-required' });
    expect(deps.saveProgress).not.toHaveBeenCalled();
  });

  it('returns mirror-pending when the Supabase user has no Payload row yet', async () => {
    const deps = makeDeps({
      getPayloadUser: vi.fn().mockResolvedValue(null),
    });
    const r = await advanceStepImpl(deps, { step: 1, data: { slug: 'mariana' } });
    expect(r).toEqual({ ok: false, reason: 'mirror-pending' });
  });

  it('returns the validation failure shape when step data is invalid', async () => {
    const deps = makeDeps();
    const r = await advanceStepImpl(deps, { step: 1, data: { slug: 'BadSlug' } });
    expect(r).toMatchObject({
      ok: false,
      field: 'slug',
      reason: 'invalid-chars',
    });
    expect(deps.saveProgress).not.toHaveBeenCalled();
    expect(deps.reserveSlug).not.toHaveBeenCalled();
  });

  it('reserves the slug on step 1 and persists progress', async () => {
    const deps = makeDeps();
    const r = await advanceStepImpl(deps, { step: 1, data: { slug: 'mariana-luz' } });
    expect(r).toEqual({ ok: true, nextStep: 2 });
    expect(deps.reserveSlug).toHaveBeenCalledWith({
      slug: 'mariana-luz',
      userId: 'sb-user-1',
    });
    expect(deps.saveProgress).toHaveBeenCalledWith(
      42,
      expect.objectContaining({ step: 1, slug: 'mariana-luz' }),
    );
    expect(deps.track).toHaveBeenCalledWith('onboarding_step_completed', { step: 1 });
  });

  it('releases the old slug when changing slug on step 1', async () => {
    const deps = makeDeps({
      getPayloadUser: vi.fn().mockResolvedValue({
        id: 42,
        supabaseUserId: 'sb-user-1',
        onboardingProgress: { step: 1, slug: 'old-slug' },
      }),
    });
    const r = await advanceStepImpl(deps, { step: 1, data: { slug: 'new-slug' } });
    expect(r).toEqual({ ok: true, nextStep: 2 });
    expect(deps.releaseSlug).toHaveBeenCalledWith({
      slug: 'old-slug',
      userId: 'sb-user-1',
    });
    expect(deps.reserveSlug).toHaveBeenCalledWith({
      slug: 'new-slug',
      userId: 'sb-user-1',
    });
  });

  it('does NOT release the slug if the same slug is re-submitted on step 1', async () => {
    const deps = makeDeps({
      getPayloadUser: vi.fn().mockResolvedValue({
        id: 42,
        supabaseUserId: 'sb-user-1',
        onboardingProgress: { step: 1, slug: 'same-slug' },
      }),
    });
    await advanceStepImpl(deps, { step: 1, data: { slug: 'same-slug' } });
    expect(deps.releaseSlug).not.toHaveBeenCalled();
  });

  it('returns the slug-reserve failure when reservation fails (e.g. taken)', async () => {
    const deps = makeDeps({
      reserveSlug: vi.fn().mockRejectedValue(new Error('slug taken')),
    });
    const r = await advanceStepImpl(deps, { step: 1, data: { slug: 'mariana' } });
    expect(r).toMatchObject({
      ok: false,
      field: 'slug',
      reason: 'reservation-failed',
    });
    expect(deps.saveProgress).not.toHaveBeenCalled();
  });

  it('persists step 3 (tagline) progress without touching slug reservation', async () => {
    const deps = makeDeps({
      getPayloadUser: vi.fn().mockResolvedValue({
        id: 42,
        supabaseUserId: 'sb-user-1',
        onboardingProgress: { step: 2, slug: 'mariana' },
      }),
    });
    const r = await advanceStepImpl(deps, {
      step: 3,
      data: { taglinePtBR: 'House melódico de SP' },
    });
    expect(r).toEqual({ ok: true, nextStep: 4 });
    expect(deps.reserveSlug).not.toHaveBeenCalled();
    expect(deps.saveProgress).toHaveBeenCalledWith(
      42,
      expect.objectContaining({
        step: 3,
        slug: 'mariana',
        taglinePtBR: 'House melódico de SP',
      }),
    );
  });
});

// =============================================================
// completeWizard
// =============================================================

const FULLY_COMPLETED_PROGRESS = {
  step: 5 as const,
  slug: 'mariana-luz',
  taglinePtBR: 'House melódico',
  services: ['DJ Set', 'Produção'],
  socialPlatform: 'instagram' as const,
  socialUrl: 'https://instagram.com/marianaluz',
};

describe('completeWizardImpl', () => {
  it('rejects if any prior step is incomplete', async () => {
    const deps = makeDeps({
      getPayloadUser: vi.fn().mockResolvedValue({
        id: 42,
        supabaseUserId: 'sb-user-1',
        onboardingProgress: { step: 4, slug: 'mariana' },
      }),
    });
    const r = await completeWizardImpl(deps);
    expect(r).toMatchObject({ ok: false, reason: 'incomplete' });
    expect(deps.createProfileBundle).not.toHaveBeenCalled();
  });

  it('creates the profile bundle with all wizard data + clears progress', async () => {
    const deps = makeDeps({
      getPayloadUser: vi.fn().mockResolvedValue({
        id: 42,
        supabaseUserId: 'sb-user-1',
        onboardingProgress: { ...FULLY_COMPLETED_PROGRESS, portraitId: 7 },
      }),
    });
    const r = await completeWizardImpl(deps);
    expect(r).toEqual({ ok: true, profileId: 99 });
    expect(deps.createProfileBundle).toHaveBeenCalledWith({
      ownerId: 42,
      slug: 'mariana-luz',
      taglinePtBR: 'House melódico',
      services: ['DJ Set', 'Produção'],
      socialPlatform: 'instagram',
      socialUrl: 'https://instagram.com/marianaluz',
      portraitId: 7,
      logoId: undefined,
    });
    // Final saveProgress call clears most fields and stamps completedAt.
    const last = (deps.saveProgress as ReturnType<typeof vi.fn>).mock.calls.at(-1)!;
    expect(last[0]).toBe(42);
    expect(last[1]).toMatchObject({ completedAt: expect.any(String) });
    expect(deps.track).toHaveBeenCalledWith('onboarding_completed', {
      profileId: 99,
    });
  });

  it('returns the existing profile id (idempotent) when one is already owned by the user', async () => {
    const deps = makeDeps({
      getPayloadUser: vi.fn().mockResolvedValue({
        id: 42,
        supabaseUserId: 'sb-user-1',
        onboardingProgress: FULLY_COMPLETED_PROGRESS,
      }),
      findExistingProfile: vi.fn().mockResolvedValue({ id: 77 }),
    });
    const r = await completeWizardImpl(deps);
    expect(r).toEqual({ ok: true, profileId: 77, alreadyExisted: true });
    expect(deps.createProfileBundle).not.toHaveBeenCalled();
  });
});

// =============================================================
// cancelWizard
// =============================================================

describe('cancelWizardImpl', () => {
  it('clears progress + releases the slug hold + tracks the event', async () => {
    const deps = makeDeps({
      getPayloadUser: vi.fn().mockResolvedValue({
        id: 42,
        supabaseUserId: 'sb-user-1',
        onboardingProgress: { step: 2, slug: 'mariana' },
      }),
    });
    const r = await cancelWizardImpl(deps);
    expect(r).toEqual({ ok: true });
    expect(deps.releaseSlug).toHaveBeenCalledWith({
      slug: 'mariana',
      userId: 'sb-user-1',
    });
    expect(deps.saveProgress).toHaveBeenCalledWith(42, null);
    expect(deps.track).toHaveBeenCalledWith('wizard_cancelled');
  });

  it('is a no-op when there is no progress (still ok)', async () => {
    const deps = makeDeps();
    const r = await cancelWizardImpl(deps);
    expect(r).toEqual({ ok: true });
    expect(deps.releaseSlug).not.toHaveBeenCalled();
    expect(deps.saveProgress).toHaveBeenCalledWith(42, null);
  });

  it('refuses to cancel after completion (avoids re-running the wizard accidentally)', async () => {
    const deps = makeDeps({
      getPayloadUser: vi.fn().mockResolvedValue({
        id: 42,
        supabaseUserId: 'sb-user-1',
        onboardingProgress: { ...FULLY_COMPLETED_PROGRESS, completedAt: '2026-05-05T00:00:00Z' },
      }),
    });
    const r = await cancelWizardImpl(deps);
    expect(r).toEqual({ ok: false, reason: 'already-completed' });
    expect(deps.saveProgress).not.toHaveBeenCalled();
  });
});

// Smoke check the curated catalog is locked in (touches state.ts).
describe('curated services catalog', () => {
  it('contains the 9 expected entries', () => {
    expect(CURATED_SERVICES).toHaveLength(9);
  });
});
