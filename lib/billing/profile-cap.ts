/**
 * Per-plan profile-count limits (task-31 PR-B).
 *
 * Trial + Pro: one profile per user (the existing onboarding wizard's
 * implicit cap, made explicit here).
 * Agency: up to 10 profiles per user (PRD §16).
 *
 * Pure module — `canCreateProfile` is called from the onboarding
 * action, the future agency-create flow, and the Payload access
 * predicate as defense-in-depth.
 */

export const PROFILE_CAP_PRO = 1;
export const PROFILE_CAP_AGENCY = 10;

export type PlanLike = string | null | undefined;

export function profileCapForPlan(plan: PlanLike): number {
  if (plan === 'agency') return PROFILE_CAP_AGENCY;
  return PROFILE_CAP_PRO;
}

export type CanCreateInput = {
  plan: PlanLike;
  ownedCount: number;
};

export type CanCreateResult =
  | { ok: true }
  | { ok: false; reason: 'unauthenticated' }
  | { ok: false; reason: 'cap-reached'; cap: number };

export function canCreateProfile(input: CanCreateInput): CanCreateResult {
  if (input.plan === null || input.plan === undefined) {
    return { ok: false, reason: 'unauthenticated' };
  }
  const cap = profileCapForPlan(input.plan);
  if (input.ownedCount >= cap) {
    return { ok: false, reason: 'cap-reached', cap };
  }
  return { ok: true };
}
