import type Stripe from 'stripe';

import { getPlan } from '../pricing/plans';

/**
 * Plan-switch (upgrade/downgrade with proration) — task-31.
 *
 * Pure DI on Stripe + Payload deps so unit tests don't touch the live
 * Stripe SDK. The route layer at `app/api/billing/switch-plan/route.ts`
 * wires the live `stripe-client` and Payload Local API.
 *
 * Stripe's `proration_behavior: 'create_prorations'` is the right knob
 * for AC #1: monthly → annual issues a prorated invoice immediately;
 * annual → monthly issues a credit applied to the next bill.
 */

export type SwitchPlanKey =
  | 'pro-monthly'
  | 'pro-annual'
  | 'agency-monthly'
  | 'agency-annual';

export type SwitchPlanDeps = {
  findUser(id: number | string): Promise<{
    id: number | string;
    stripeSubscriptionId: string | null;
  } | null>;
  stripe: Pick<Stripe, 'subscriptions'>;
};

export type SwitchPlanResult =
  | { ok: true; subscriptionId: string; status: string }
  | {
      ok: false;
      reason:
        | 'unknown-plan'
        | 'not-configured'
        | 'no-subscription'
        | 'user-not-found'
        | 'stripe-error';
      message: string;
    };

export async function switchPlan(args: {
  userId: number | string;
  planKey: SwitchPlanKey;
  deps: SwitchPlanDeps;
}): Promise<SwitchPlanResult> {
  const priceId = resolvePriceForKey(args.planKey);
  if (priceId === 'unknown') {
    return {
      ok: false,
      reason: 'unknown-plan',
      message: `Unknown plan key: ${String(args.planKey)}`,
    };
  }
  if (!priceId) {
    return {
      ok: false,
      reason: 'not-configured',
      message: `Stripe Price ID env not set for ${args.planKey}`,
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
  if (!user.stripeSubscriptionId) {
    return {
      ok: false,
      reason: 'no-subscription',
      message: 'User has no active Stripe subscription to switch.',
    };
  }

  try {
    const subscription = await args.deps.stripe.subscriptions.retrieve(
      user.stripeSubscriptionId,
    );
    const itemId = readFirstItemId(subscription);
    if (!itemId) {
      return {
        ok: false,
        reason: 'stripe-error',
        message: 'Subscription has no line items',
      };
    }
    const updated = await args.deps.stripe.subscriptions.update(
      user.stripeSubscriptionId,
      {
        items: [{ id: itemId, price: priceId }],
        proration_behavior: 'create_prorations',
      },
    );
    return {
      ok: true,
      subscriptionId: String((updated as { id?: string }).id ?? user.stripeSubscriptionId),
      status: String((updated as { status?: string }).status ?? 'active'),
    };
  } catch (err) {
    return {
      ok: false,
      reason: 'stripe-error',
      message: err instanceof Error ? err.message : 'Unknown Stripe error',
    };
  }
}

function readFirstItemId(sub: unknown): string | null {
  const items = (sub as { items?: { data?: Array<{ id?: string }> } }).items;
  const id = items?.data?.[0]?.id;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

function resolvePriceForKey(key: SwitchPlanKey): string | 'unknown' | null {
  switch (key) {
    case 'pro-monthly': {
      const env = getPlan('pro')?.stripePriceIdEnv;
      return env ? process.env[env] || null : null;
    }
    case 'pro-annual': {
      const env = getPlan('pro')?.stripePriceIdAnnualEnv;
      return env ? process.env[env] || null : null;
    }
    case 'agency-monthly': {
      const env = getPlan('agency')?.stripePriceIdEnv;
      return (
        (env ? process.env[env] : null) ??
        process.env.STRIPE_PRICE_ID_AGENCY ??
        null
      );
    }
    case 'agency-annual': {
      const env = getPlan('agency')?.stripePriceIdAnnualEnv;
      return env ? process.env[env] || null : null;
    }
    default:
      return 'unknown';
  }
}
