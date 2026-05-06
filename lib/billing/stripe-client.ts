import 'server-only';

import Stripe from 'stripe';

/**
 * Lazy Stripe SDK init. The SDK is heavy enough that we don't want it
 * landing in the marketing-page bundle — only routes that import this
 * module (server actions, webhook + cron routes) pay the cost.
 *
 * Returns `null` when `STRIPE_SECRET_KEY` is unset, so callers can
 * surface a friendly "[dev] Stripe não configurado" message without
 * crashing the server. Same posture as task-14's Resend integration.
 */

let cached: Stripe | null = null;

export function stripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (cached) return cached;
  cached = new Stripe(key, {
    // Pinned via the SDK's own default. The Stripe-Version header lives
    // alongside the SDK release; bumping the SDK is the only way to
    // change it. Avoids drift between code expectations and Stripe's
    // event-payload shape.
    typescript: true,
    appInfo: {
      name: 'PressKit Pro',
      version: '0.1.0',
    },
  });
  return cached;
}

export function getStripeClientOrThrow(): Stripe {
  const client = stripeClient();
  if (!client) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return client;
}
