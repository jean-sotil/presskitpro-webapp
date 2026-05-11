import 'server-only';

export type ResolvedPlan = {
  plan: 'pro' | 'agency';
  cycle: 'monthly' | 'annual';
};

const ENV_MAP: ReadonlyArray<{ env: string; resolve: ResolvedPlan }> = [
  { env: 'PAYPAL_PLAN_ID_PRO_MONTHLY', resolve: { plan: 'pro', cycle: 'monthly' } },
  { env: 'PAYPAL_PLAN_ID_PRO_ANNUAL', resolve: { plan: 'pro', cycle: 'annual' } },
  { env: 'PAYPAL_PLAN_ID_AGENCY_MONTHLY', resolve: { plan: 'agency', cycle: 'monthly' } },
  { env: 'PAYPAL_PLAN_ID_AGENCY_ANNUAL', resolve: { plan: 'agency', cycle: 'annual' } },
];

export function paypalPlanIdToPlan(planId: string): ResolvedPlan | null {
  for (const mapping of ENV_MAP) {
    const envValue = process.env[mapping.env];
    if (envValue && envValue === planId) {
      return mapping.resolve;
    }
  }
  return null;
}
