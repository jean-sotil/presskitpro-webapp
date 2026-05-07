import type { BillingCycle, PlanId } from './plans';

/**
 * Reverse map from a Stripe Price ID to the plan + cycle it represents.
 *
 * Used by the webhook handler to flip `Users.plan` when a subscription
 * is created / updated / deleted. Returns `null` for unknown ids so the
 * webhook can log + skip rather than mis-flip.
 *
 * Knows about a one-release rolling-deploy fallback: `STRIPE_PRICE_ID_AGENCY`
 * (the old single-cycle name) maps to `agency monthly` so a deploy that
 * lands the new env names slightly after the code rename doesn't break.
 */

export type ResolvedPlan = {
  plan: Exclude<PlanId, 'trial'>;
  cycle: BillingCycle;
};

const ENV_MAP: ReadonlyArray<{ env: string; resolve: ResolvedPlan }> = [
  { env: 'STRIPE_PRICE_ID_PRO_MONTHLY', resolve: { plan: 'pro', cycle: 'monthly' } },
  { env: 'STRIPE_PRICE_ID_PRO_ANNUAL', resolve: { plan: 'pro', cycle: 'annual' } },
  { env: 'STRIPE_PRICE_ID_AGENCY_MONTHLY', resolve: { plan: 'agency', cycle: 'monthly' } },
  { env: 'STRIPE_PRICE_ID_AGENCY_ANNUAL', resolve: { plan: 'agency', cycle: 'annual' } },
  // Legacy single-cycle name. Drop after one release once every
  // deployment has migrated to STRIPE_PRICE_ID_AGENCY_MONTHLY.
  { env: 'STRIPE_PRICE_ID_AGENCY', resolve: { plan: 'agency', cycle: 'monthly' } },
];

export function priceIdToPlan(priceId: string): ResolvedPlan | null {
  if (!priceId) return null;
  for (const { env, resolve } of ENV_MAP) {
    const value = process.env[env];
    if (value && value === priceId) return resolve;
  }
  return null;
}
