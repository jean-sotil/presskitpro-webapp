import type { PayPalClient } from './paypal-client';
import { getPlan } from '../pricing/plans';

export type SwitchPlanKey = 'pro-monthly' | 'pro-annual' | 'agency-monthly' | 'agency-annual';

export type SwitchPlanDeps = {
  findUser(id: number | string): Promise<{
    id: number | string;
    paypalSubscriptionId: string | null;
  } | null>;
  paypal: PayPalClient;
};

export type SwitchPlanResult =
  | { ok: true; subscriptionId: string; status: string }
  | {
      ok: false;
      reason: 'unknown-plan' | 'not-configured' | 'no-subscription' | 'user-not-found' | 'paypal-error';
      message: string;
    };

export async function switchPlan(args: {
  userId: number | string;
  planKey: SwitchPlanKey;
  deps: SwitchPlanDeps;
}): Promise<SwitchPlanResult> {
  const planId = resolvePlanIdForKey(args.planKey);
  if (planId === 'unknown') {
    return {
      ok: false,
      reason: 'unknown-plan',
      message: `Unknown plan key: ${String(args.planKey)}`,
    };
  }
  if (!planId) {
    return {
      ok: false,
      reason: 'not-configured',
      message: `PayPal Plan ID env not set for ${args.planKey}`,
    };
  }

  const user = await args.deps.findUser(args.userId);
  if (!user) {
    return {
      ok: false,
      reason: 'user-not-found',
      message: `User ${String(args.userId)} not found`,
    };
  }
  if (!user.paypalSubscriptionId) {
    return {
      ok: false,
      reason: 'no-subscription',
      message: 'User has no active PayPal subscription to switch.',
    };
  }

  try {
    const response = await args.deps.paypal.patch(
      `/v1/billing/subscriptions/${user.paypalSubscriptionId}/revise`,
      { plan_id: planId },
    );

    if (!response.ok) {
      return {
        ok: false,
        reason: 'paypal-error',
        message: `PayPal error: ${response.status} ${await response.text()}`,
      };
    }

    const body = (await response.json()) as { id?: string; status?: string };
    return {
      ok: true,
      subscriptionId: String(body.id ?? user.paypalSubscriptionId),
      status: String(body.status ?? 'ACTIVE'),
    };
  } catch (err) {
    return {
      ok: false,
      reason: 'paypal-error',
      message: err instanceof Error ? err.message : 'Unknown PayPal error',
    };
  }
}

function resolvePlanIdForKey(key: SwitchPlanKey): string | 'unknown' | null {
  switch (key) {
    case 'pro-monthly': {
      const env = getPlan('pro')?.paypalPlanIdEnv;
      return env ? process.env[env] || null : null;
    }
    case 'pro-annual': {
      const env = getPlan('pro')?.paypalPlanIdAnnualEnv;
      return env ? process.env[env] || null : null;
    }
    case 'agency-monthly': {
      const env = getPlan('agency')?.paypalPlanIdEnv;
      return env ? process.env[env] || null : null;
    }
    case 'agency-annual': {
      const env = getPlan('agency')?.paypalPlanIdAnnualEnv;
      return env ? process.env[env] || null : null;
    }
    default:
      return 'unknown';
  }
}
