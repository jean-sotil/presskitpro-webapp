import { priceIdToPlan } from '../pricing/price-id-to-plan';

/**
 * Pure dispatch for the events the app cares about. The route layer is
 * responsible for signature verification and parsing — it then calls
 * this with `{ event, deps }`. Returning a tagged result lets the route
 * map to a 200 (handled / ignored / duplicate) without leaking internals.
 *
 * Five events the app cares about (PRD §16, plans §6, §16 task-31):
 *   - checkout.session.completed       → user converted; mirror sub + flip plan.
 *   - customer.subscription.created    → first sub + plan via priceIdToPlan (task-31).
 *   - customer.subscription.updated    → upgrade/downgrade/proration (task-31).
 *   - invoice.payment_failed           → mirror past_due; do NOT pause yet.
 *   - customer.subscription.deleted    → terminal; downgrade + pause profiles.
 *
 * Anything else returns `ignored` (still logged for idempotency so retries
 * short-circuit).
 */

export type StripeEventLike = {
  id: string;
  type: string;
  data: { object: Record<string, unknown> };
};

export type WebhookUser = { id: number | string; email?: string | null };

export type WebhookDeps = {
  isEventProcessed: (eventId: string) => Promise<boolean>;
  markEventProcessed: (eventId: string, eventType: string) => Promise<void>;
  findUserByCustomerId: (customerId: string) => Promise<WebhookUser | null>;
  findUserByEmail: (email: string) => Promise<WebhookUser | null>;
  updateUser: (
    userId: number | string,
    patch: {
      plan?: 'trial' | 'pro' | 'agency';
      stripeCustomerId?: string | null;
      stripeSubscriptionId?: string | null;
      stripeSubscriptionStatus?: 'active' | 'past_due' | 'canceled' | null;
    },
  ) => Promise<void>;
  pauseUserProfiles: (userId: number | string) => Promise<number>;
  log: (entry: Record<string, unknown>) => void;
};

export type WebhookResult =
  | { kind: 'handled' }
  | { kind: 'ignored'; reason?: string }
  | { kind: 'duplicate' };

const HANDLED_TYPES = new Set([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'invoice.payment_failed',
  'customer.subscription.deleted',
]);

export async function handleStripeWebhook(args: {
  event: StripeEventLike;
  deps: WebhookDeps;
}): Promise<WebhookResult> {
  const { event, deps } = args;

  if (await deps.isEventProcessed(event.id)) {
    return { kind: 'duplicate' };
  }

  let result: WebhookResult;
  switch (event.type) {
    case 'checkout.session.completed':
      result = await handleCheckoutCompleted(event, deps);
      break;
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      result = await handleSubscriptionChanged(event, deps);
      break;
    case 'invoice.payment_failed':
      result = await handlePaymentFailed(event, deps);
      break;
    case 'customer.subscription.deleted':
      result = await handleSubscriptionDeleted(event, deps);
      break;
    default:
      result = { kind: 'ignored', reason: 'unhandled-type' };
  }

  if (HANDLED_TYPES.has(event.type) || result.kind !== 'duplicate') {
    await deps.markEventProcessed(event.id, event.type);
  }
  return result;
}

async function handleCheckoutCompleted(
  event: StripeEventLike,
  deps: WebhookDeps,
): Promise<WebhookResult> {
  const session = event.data.object;
  const customerId = stringField(session, 'customer');
  const subscriptionId = stringField(session, 'subscription');
  const email = stringField(session, 'customer_email');

  if (!customerId) {
    deps.log({ kind: 'webhook-missing-customer', eventId: event.id });
    return { kind: 'ignored', reason: 'missing-customer' };
  }

  let user = await deps.findUserByCustomerId(customerId);
  if (!user && email) {
    // First checkout for this user: the customer id is brand-new and no
    // Users row references it yet. Fall back to email match.
    user = await deps.findUserByEmail(email);
  }
  if (!user) {
    deps.log({
      kind: 'webhook-orphan-checkout',
      eventId: event.id,
      customerId,
      email,
    });
    return { kind: 'ignored', reason: 'no-user-match' };
  }

  await deps.updateUser(user.id, {
    plan: 'pro',
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId ?? null,
    stripeSubscriptionStatus: 'active',
  });
  return { kind: 'handled' };
}

async function handleSubscriptionChanged(
  event: StripeEventLike,
  deps: WebhookDeps,
): Promise<WebhookResult> {
  const sub = event.data.object;
  const customerId = stringField(sub, 'customer');
  if (!customerId) return { kind: 'ignored', reason: 'missing-customer' };

  const user = await deps.findUserByCustomerId(customerId);
  if (!user) {
    deps.log({
      kind: 'webhook-orphan-subscription-changed',
      eventId: event.id,
      customerId,
    });
    return { kind: 'ignored', reason: 'no-user-match' };
  }

  // Stripe subscription objects expose `items.data[].price.id` for the
  // current line items. Pull the first one — our subscriptions are
  // single-product. Pure `priceIdToPlan` reverse-maps to a plan name.
  const priceId = readFirstItemPriceId(sub);
  const resolved = priceId ? priceIdToPlan(priceId) : null;
  if (!resolved) {
    deps.log({
      kind: 'webhook-unknown-price',
      eventId: event.id,
      priceId,
      subscriptionId: stringField(sub, 'id'),
    });
    return { kind: 'ignored', reason: 'unknown-price' };
  }

  const status = stringField(sub, 'status');
  await deps.updateUser(user.id, {
    plan: resolved.plan,
    stripeSubscriptionId: stringField(sub, 'id'),
    stripeSubscriptionStatus:
      status === 'active' || status === 'past_due' || status === 'canceled'
        ? (status as 'active' | 'past_due' | 'canceled')
        : 'active',
  });
  return { kind: 'handled' };
}

function readFirstItemPriceId(sub: Record<string, unknown>): string | null {
  const items = sub.items as { data?: Array<{ price?: { id?: string } }> } | undefined;
  const price = items?.data?.[0]?.price;
  return typeof price?.id === 'string' && price.id.length > 0 ? price.id : null;
}

async function handlePaymentFailed(
  event: StripeEventLike,
  deps: WebhookDeps,
): Promise<WebhookResult> {
  const invoice = event.data.object;
  const customerId = stringField(invoice, 'customer');
  if (!customerId) return { kind: 'ignored', reason: 'missing-customer' };

  const user = await deps.findUserByCustomerId(customerId);
  if (!user) {
    deps.log({ kind: 'webhook-orphan-payment-failed', eventId: event.id, customerId });
    return { kind: 'ignored', reason: 'no-user-match' };
  }

  // Don't pause profiles here — Stripe smart-retries automatically. Only
  // the terminal `customer.subscription.deleted` event should pause.
  await deps.updateUser(user.id, { stripeSubscriptionStatus: 'past_due' });
  return { kind: 'handled' };
}

async function handleSubscriptionDeleted(
  event: StripeEventLike,
  deps: WebhookDeps,
): Promise<WebhookResult> {
  const sub = event.data.object;
  const customerId = stringField(sub, 'customer');
  if (!customerId) return { kind: 'ignored', reason: 'missing-customer' };

  const user = await deps.findUserByCustomerId(customerId);
  if (!user) {
    deps.log({ kind: 'webhook-orphan-subscription-deleted', eventId: event.id, customerId });
    return { kind: 'ignored', reason: 'no-user-match' };
  }

  await deps.updateUser(user.id, {
    plan: 'trial',
    stripeSubscriptionId: null,
    stripeSubscriptionStatus: 'canceled',
  });
  const paused = await deps.pauseUserProfiles(user.id);
  deps.log({
    kind: 'subscription-canceled-email',
    userId: user.id,
    email: user.email,
    pausedProfiles: paused,
  });
  return { kind: 'handled' };
}

function stringField(obj: Record<string, unknown>, key: string): string | null {
  const v = obj[key];
  return typeof v === 'string' && v.length > 0 ? v : null;
}
