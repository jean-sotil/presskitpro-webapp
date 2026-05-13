import 'server-only';

import { getPlan } from '../pricing/plans';

import { getPayPalClientOrThrow } from './paypal-client';

export type CheckoutPlanKey = 'pro-monthly' | 'pro-annual' | 'agency-monthly' | 'agency-annual' | 'agency';

type CreateSubscriptionInput = {
  planKey: CheckoutPlanKey;
  user: {
    id: number | string;
    email: string;
  };
  returnUrl: string;
  cancelUrl: string;
};

type CreateSubscriptionOutput =
  | { ok: true; approveUrl: string; subscriptionId: string }
  | { ok: false; reason: 'not-configured' | 'unknown-plan'; message: string };

export async function createPayPalSubscription(
  input: CreateSubscriptionInput,
): Promise<CreateSubscriptionOutput> {
  const paypal = getPayPalClientOrThrowSafe();
  if (!paypal) {
    return {
      ok: false,
      reason: 'not-configured',
      message: '[dev] PayPal não configurado — defina PAYPAL_CLIENT_ID e PAYPAL_CLIENT_SECRET no .env.',
    };
  }

  const planId = resolvePayPalPlanId(input.planKey);
  if (!planId) {
    return {
      ok: false,
      reason: 'unknown-plan',
      message: `PayPal Plan ID não configurado para ${input.planKey}.`,
    };
  }

  const response = await paypal.post('/v1/billing/subscriptions', {
    plan_id: planId,
    subscriber: {
      email_address: input.user.email,
    },
    application_context: {
      return_url: input.returnUrl,
      cancel_url: input.cancelUrl,
      user_action: 'SUBSCRIBE_NOW',
      brand_name: 'PressKit Pro',
      locale: 'pt-BR',
    },
    custom_id: String(input.user.id),
  });

  if (!response.ok) {
    const text = await response.text();
    return {
      ok: false,
      reason: 'not-configured',
      message: `PayPal subscription creation failed: ${response.status} ${text}`,
    };
  }

  const body = (await response.json()) as {
    id: string;
    links?: Array<{ rel: string; href: string }>;
  };

  const approveLink = body.links?.find((link) => link.rel === 'approve');
  if (!approveLink) {
    return {
      ok: false,
      reason: 'not-configured',
      message: 'PayPal subscription response missing approval link',
    };
  }

  return {
    ok: true,
    approveUrl: approveLink.href,
    subscriptionId: body.id,
  };
}

function resolvePayPalPlanId(planKey: CheckoutPlanKey): string | null {
  switch (planKey) {
    case 'pro-monthly': {
      const plan = getPlan('pro');
      if (!plan?.paypalPlanIdEnv) return null;
      const planId = process.env[plan.paypalPlanIdEnv] ?? null;
      console.log('[PayPal Plan Resolution]', {
        planKey,
        envVar: plan.paypalPlanIdEnv,
        resolvedId: planId?.substring(0, 10) + '...',
      });
      return planId;
    }
    case 'pro-annual': {
      const plan = getPlan('pro');
      if (!plan?.paypalPlanIdAnnualEnv) return null;
      const planId = process.env[plan.paypalPlanIdAnnualEnv] ?? null;
      console.log('[PayPal Plan Resolution]', {
        planKey,
        envVar: plan.paypalPlanIdAnnualEnv,
        resolvedId: planId?.substring(0, 10) + '...',
      });
      return planId;
    }
    case 'agency':
    case 'agency-monthly': {
      const plan = getPlan('agency');
      if (!plan?.paypalPlanIdEnv) return null;
      const planId = process.env[plan.paypalPlanIdEnv] ?? null;
      console.log('[PayPal Plan Resolution]', {
        planKey,
        envVar: plan.paypalPlanIdEnv,
        resolvedId: planId?.substring(0, 10) + '...',
      });
      return planId;
    }
    case 'agency-annual': {
      const plan = getPlan('agency');
      if (!plan?.paypalPlanIdAnnualEnv) return null;
      const planId = process.env[plan.paypalPlanIdAnnualEnv] ?? null;
      console.log('[PayPal Plan Resolution]', {
        planKey,
        envVar: plan.paypalPlanIdAnnualEnv,
        resolvedId: planId?.substring(0, 10) + '...',
      });
      return planId;
    }
    default:
      return null;
  }
}

function getPayPalClientOrThrowSafe() {
  try {
    return getPayPalClientOrThrow();
  } catch {
    return null;
  }
}
