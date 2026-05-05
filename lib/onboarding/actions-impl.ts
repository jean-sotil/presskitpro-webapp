import { track as defaultTrack } from '../analytics/track';
import {
  isComplete,
  nextStep,
  type OnboardingProgress,
  type SocialPlatform,
  validateStepData,
  type ValidateResult,
  type WizardStep,
} from './state';

/**
 * Pure-ish implementation of the onboarding server actions, with all I/O
 * abstracted behind the `WizardDeps` interface. The thin server-action
 * shim in `app/onboarding/actions.ts` wires the real Supabase + Payload
 * clients; tests inject mocks.
 */

export type WizardDeps = {
  // Auth
  getSupabaseUser(): Promise<{ id: string; email: string | null } | null>;
  // Payload mirror lookup. `null` when the auth-sync webhook hasn't
  // fired yet — a brief but real window per ADR-0001.
  getPayloadUser(supabaseUserId: string): Promise<{
    id: number | string;
    supabaseUserId: string;
    onboardingProgress: OnboardingProgress | null;
  } | null>;

  // Persistence
  saveProgress(
    userId: number | string,
    progress: OnboardingProgress | null,
  ): Promise<void>;

  // Profile lifecycle
  findExistingProfile(
    ownerId: number | string,
  ): Promise<{ id: number | string } | null>;
  createProfileBundle(args: {
    ownerId: number | string;
    slug: string;
    taglinePtBR: string;
    services: string[];
    socialPlatform: SocialPlatform;
    socialUrl: string;
    portraitId: number | undefined;
    logoId: number | undefined;
  }): Promise<{ id: number | string }>;

  // Slug holds (task-07)
  reserveSlug(args: { slug: string; userId: string }): Promise<void>;
  releaseSlug(args: { slug: string; userId: string }): Promise<void>;

  // Analytics shim (allows tests to assert without importing the global).
  track: typeof defaultTrack;
};

// ---------------------------- advanceStep -------------------------------

type AdvanceArgs = {
  step: WizardStep;
  data: Partial<OnboardingProgress>;
};

export type AdvanceResult =
  | { ok: true; nextStep: WizardStep }
  | ({ ok: false } & ({ reason: 'auth-required' | 'mirror-pending' } | (ValidateResult & { ok: false }) | { reason: 'reservation-failed'; field: 'slug' }));

export async function advanceStepImpl(
  deps: WizardDeps,
  args: AdvanceArgs,
): Promise<AdvanceResult> {
  const sbUser = await deps.getSupabaseUser();
  if (!sbUser) return { ok: false, reason: 'auth-required' };

  const payloadUser = await deps.getPayloadUser(sbUser.id);
  if (!payloadUser) return { ok: false, reason: 'mirror-pending' };

  const validation = validateStepData(args.step, args.data);
  if (!validation.ok) {
    return validation;
  }

  // Slug-reserve choreography lives only on step 1. The hold is owned by
  // the Supabase user id (matches `slug_reservations.held_by_user_id`).
  if (args.step === 1) {
    const newSlug = args.data.slug!;
    const oldSlug = payloadUser.onboardingProgress?.slug;
    if (oldSlug && oldSlug !== newSlug) {
      await deps.releaseSlug({ slug: oldSlug, userId: sbUser.id }).catch(() => {
        // Don't block on stale-slug release; the cron sweeps it anyway.
      });
    }
    if (oldSlug !== newSlug) {
      try {
        await deps.reserveSlug({ slug: newSlug, userId: sbUser.id });
      } catch {
        return { ok: false, field: 'slug', reason: 'reservation-failed' };
      }
    }
  }

  const merged: OnboardingProgress = {
    ...(payloadUser.onboardingProgress ?? {}),
    ...args.data,
    step: args.step,
  };
  await deps.saveProgress(payloadUser.id, merged);
  deps.track('onboarding_step_completed', { step: args.step });

  return { ok: true, nextStep: nextStep(merged) };
}

// --------------------------- completeWizard -----------------------------

export type CompleteResult =
  | { ok: true; profileId: number | string; alreadyExisted?: true }
  | { ok: false; reason: 'auth-required' | 'mirror-pending' | 'incomplete' };

export async function completeWizardImpl(
  deps: WizardDeps,
): Promise<CompleteResult> {
  const sbUser = await deps.getSupabaseUser();
  if (!sbUser) return { ok: false, reason: 'auth-required' };

  const payloadUser = await deps.getPayloadUser(sbUser.id);
  if (!payloadUser) return { ok: false, reason: 'mirror-pending' };

  // R2 idempotency: if the user already owns a profile, return it. Avoids
  // duplicate creation if the wizard is opened in two tabs.
  const existing = await deps.findExistingProfile(payloadUser.id);
  if (existing) {
    deps.track('onboarding_completed', { profileId: existing.id });
    return { ok: true, profileId: existing.id, alreadyExisted: true };
  }

  const progress = payloadUser.onboardingProgress;
  if (!progress) return { ok: false, reason: 'incomplete' };
  if (
    !progress.slug ||
    !progress.taglinePtBR ||
    !progress.services?.length ||
    !progress.socialPlatform ||
    !progress.socialUrl
  ) {
    return { ok: false, reason: 'incomplete' };
  }

  const created = await deps.createProfileBundle({
    ownerId: payloadUser.id,
    slug: progress.slug,
    taglinePtBR: progress.taglinePtBR,
    services: progress.services,
    socialPlatform: progress.socialPlatform,
    socialUrl: progress.socialUrl,
    portraitId: progress.portraitId ?? undefined,
    logoId: progress.logoId ?? undefined,
  });

  await deps.saveProgress(payloadUser.id, {
    completedAt: new Date().toISOString(),
  });
  deps.track('onboarding_completed', { profileId: created.id });
  return { ok: true, profileId: created.id };
}

// ---------------------------- cancelWizard ------------------------------

export type CancelResult =
  | { ok: true }
  | { ok: false; reason: 'auth-required' | 'mirror-pending' | 'already-completed' };

export async function cancelWizardImpl(deps: WizardDeps): Promise<CancelResult> {
  const sbUser = await deps.getSupabaseUser();
  if (!sbUser) return { ok: false, reason: 'auth-required' };

  const payloadUser = await deps.getPayloadUser(sbUser.id);
  if (!payloadUser) return { ok: false, reason: 'mirror-pending' };

  if (isComplete(payloadUser.onboardingProgress)) {
    return { ok: false, reason: 'already-completed' };
  }

  const slug = payloadUser.onboardingProgress?.slug;
  if (slug) {
    await deps.releaseSlug({ slug, userId: sbUser.id }).catch(() => {
      // Same posture as advanceStep — releases are best-effort.
    });
  }

  await deps.saveProgress(payloadUser.id, null);
  deps.track('wizard_cancelled');
  return { ok: true };
}
