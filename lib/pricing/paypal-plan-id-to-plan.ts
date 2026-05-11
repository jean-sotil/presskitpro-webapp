import { PLANS, type PlanId } from './plans';

export type PayPalPlanInfo = { plan: PlanId; cycle: 'monthly' | 'annual' };

export function paypalPlanIdToPlan(planId: string | null | undefined): PayPalPlanInfo | null {
  if (!planId) return null;

  for (const plan of PLANS) {
    if (plan.paypalPlanIdEnv) {
      const envValue = process.env[plan.paypalPlanIdEnv];
      if (envValue === planId) {
        return { plan: plan.id, cycle: 'monthly' };
      }
    }
    if (plan.paypalPlanIdAnnualEnv) {
      const envValue = process.env[plan.paypalPlanIdAnnualEnv];
      if (envValue === planId) {
        return { plan: plan.id, cycle: 'annual' };
      }
    }
  }

  return null;
}
