import 'server-only';

import type Stripe from 'stripe';

import { getPlan } from '../pricing/plans';

import { getStripeClientOrThrow } from './stripe-client';

/**
 * Creates a Stripe Checkout session for the user, lazily creating the
 * Stripe Customer on first attempt and persisting the resulting
 * `customer.id` on the Users mirror.
 *
 * Plan-doc Decision #2: customer is created here, not on signup. Trial
 * runs entirely from `Users.trialEndsAt` until the user clicks
 * "Continuar para o checkout seguro" — that's when Stripe enters the
 * picture.
 *
 * The CTA path -> Stripe Price ID mapping is keyed by `lib/pricing/plans`
 * so display + checkout never drift. Annual + Agency Price IDs default
 * to "" until task-31 wires them; this function returns a structured
 * error so the page can render "[dev] Stripe não configurado" instead
 * of a 500.
 */

export type CheckoutPlanKey =
  | 'pro-monthly'
  | 'pro-annual'
  | 'agency-monthly'
  | 'agency-annual'
  // Legacy alias for `agency-monthly` — accepted for one rolling-deploy
  // release so existing CTAs continue to resolve. Drop after task-31
  // PR-B's pricing-page rollout lands.
  | 'agency';

type CheckoutInput = {
  planKey: CheckoutPlanKey;
  user: {
    id: number | string;
    email: string;
    stripeCustomerId?: string | null;
  };
  successUrl: string;
  cancelUrl: string;
};

type CheckoutOutput =
  | { ok: true; url: string; sessionId: string; customerId: string }
  | { ok: false; reason: 'not-configured' | 'unknown-plan'; message: string };

export type PersistCustomerId = (
  userId: number | string,
  customerId: string,
) => Promise<void>;

export async function createCheckoutSession(
  input: CheckoutInput,
  persistCustomerId: PersistCustomerId,
): Promise<CheckoutOutput> {
  const stripe = getStripeClientOrThrowSafe();
  if (!stripe) {
    return {
      ok: false,
      reason: 'not-configured',
      message: '[dev] Stripe não configurado — defina STRIPE_SECRET_KEY no .env.',
    };
  }

  const priceId = resolvePriceId(input.planKey);
  if (!priceId) {
    return {
      ok: false,
      reason: 'unknown-plan',
      message: `Stripe Price ID não configurado para ${input.planKey}.`,
    };
  }

  const customerId = await ensureCustomer(stripe, input.user, persistCustomerId);

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    allow_promotion_codes: true,
    // The trial ran on our side — Stripe charges from day 1 of the
    // subscription. Do not set `subscription_data.trial_period_days`.
    client_reference_id: String(input.user.id),
  });

  if (!session.url) {
    throw new Error('Stripe returned a session without a redirect URL');
  }
  return { ok: true, url: session.url, sessionId: session.id, customerId };
}

async function ensureCustomer(
  stripe: Stripe,
  user: { id: number | string; email: string; stripeCustomerId?: string | null },
  persistCustomerId: PersistCustomerId,
): Promise<string> {
  if (user.stripeCustomerId) return user.stripeCustomerId;
  const customer = await stripe.customers.create({
    email: user.email,
    metadata: { userId: String(user.id) },
  });
  await persistCustomerId(user.id, customer.id);
  return customer.id;
}

function resolvePriceId(planKey: CheckoutPlanKey): string | null {
  switch (planKey) {
    case 'pro-monthly': {
      const plan = getPlan('pro');
      if (!plan?.stripePriceIdEnv) return null;
      return process.env[plan.stripePriceIdEnv] ?? null;
    }
    case 'pro-annual': {
      const plan = getPlan('pro');
      if (!plan?.stripePriceIdAnnualEnv) return null;
      return process.env[plan.stripePriceIdAnnualEnv] ?? null;
    }
    case 'agency':
    case 'agency-monthly': {
      const plan = getPlan('agency');
      if (!plan?.stripePriceIdEnv) return null;
      // Honor the legacy `STRIPE_PRICE_ID_AGENCY` env name as a
      // fallback so a deploy mid-rename doesn't break checkout.
      return (
        process.env[plan.stripePriceIdEnv] ??
        process.env.STRIPE_PRICE_ID_AGENCY ??
        null
      );
    }
    case 'agency-annual': {
      const plan = getPlan('agency');
      if (!plan?.stripePriceIdAnnualEnv) return null;
      return process.env[plan.stripePriceIdAnnualEnv] ?? null;
    }
    default:
      return null;
  }
}

function getStripeClientOrThrowSafe(): Stripe | null {
  try {
    return getStripeClientOrThrow();
  } catch {
    return null;
  }
}
