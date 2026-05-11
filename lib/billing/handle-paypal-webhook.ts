import { paypalPlanIdToPlan } from '../pricing/paypal-plan-id-to-plan';

export type PayPalEventLike = {
  id: string;
  event_type: string;
  resource: Record<string, unknown>;
};

export type WebhookUser = { id: number | string; email?: string | null };

export type WebhookDeps = {
  isEventProcessed: (eventId: string) => Promise<boolean>;
  markEventProcessed: (eventId: string, eventType: string) => Promise<void>;
  findUserBySubscriptionId: (subscriptionId: string) => Promise<WebhookUser | null>;
  findUserByEmail: (email: string) => Promise<WebhookUser | null>;
  updateUser: (
    userId: number | string,
    patch: {
      plan?: 'trial' | 'pro' | 'agency';
      paypalCustomerId?: string | null;
      paypalSubscriptionId?: string | null;
      paypalSubscriptionStatus?: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | null;
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
  'BILLING.SUBSCRIPTION.ACTIVATED',
  'BILLING.SUBSCRIPTION.UPDATED',
  'BILLING.SUBSCRIPTION.PAYMENT.FAILED',
  'PAYMENT.SALE.DENIED',
  'BILLING.SUBSCRIPTION.CANCELLED',
  'BILLING.SUBSCRIPTION.EXPIRED',
]);

export async function handlePayPalWebhook(args: {
  event: PayPalEventLike;
  deps: WebhookDeps;
}): Promise<WebhookResult> {
  const { event, deps } = args;

  if (await deps.isEventProcessed(event.id)) {
    return { kind: 'duplicate' };
  }

  let result: WebhookResult;
  switch (event.event_type) {
    case 'BILLING.SUBSCRIPTION.ACTIVATED':
      result = await handleSubscriptionActivated(event, deps);
      break;
    case 'BILLING.SUBSCRIPTION.UPDATED':
      result = await handleSubscriptionUpdated(event, deps);
      break;
    case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
    case 'PAYMENT.SALE.DENIED':
      result = await handlePaymentFailed(event, deps);
      break;
    case 'BILLING.SUBSCRIPTION.CANCELLED':
    case 'BILLING.SUBSCRIPTION.EXPIRED':
      result = await handleSubscriptionCancelled(event, deps);
      break;
    default:
      result = { kind: 'ignored', reason: 'unhandled-type' };
  }

  if (HANDLED_TYPES.has(event.event_type) || result.kind !== 'duplicate') {
    await deps.markEventProcessed(event.id, event.event_type);
  }
  return result;
}

async function handleSubscriptionActivated(
  event: PayPalEventLike,
  deps: WebhookDeps,
): Promise<WebhookResult> {
  const resource = event.resource;
  const subscriptionId = stringField(resource, 'id');
  const planId = stringField(resource, 'plan_id');
  const payerId = readPayerId(resource);

  if (!subscriptionId) {
    deps.log({ kind: 'webhook-missing-subscription-id', eventId: event.id });
    return { kind: 'ignored', reason: 'missing-subscription-id' };
  }

  if (!planId) {
    deps.log({ kind: 'webhook-missing-plan-id', eventId: event.id, subscriptionId });
    return { kind: 'ignored', reason: 'missing-plan-id' };
  }

  const resolved = paypalPlanIdToPlan(planId);
  if (!resolved) {
    deps.log({
      kind: 'webhook-unknown-plan',
      eventId: event.id,
      subscriptionId,
      planId,
    });
    return { kind: 'ignored', reason: 'unknown-plan' };
  }

  let user = await deps.findUserBySubscriptionId(subscriptionId);
  if (!user) {
    const email = readSubscriberEmail(resource);
    if (email) {
      user = await deps.findUserByEmail(email);
    }
  }

  if (!user) {
    deps.log({
      kind: 'webhook-orphan-subscription-activated',
      eventId: event.id,
      subscriptionId,
    });
    return { kind: 'ignored', reason: 'no-user-match' };
  }

  await deps.updateUser(user.id, {
    plan: resolved.plan,
    paypalCustomerId: payerId,
    paypalSubscriptionId: subscriptionId,
    paypalSubscriptionStatus: 'ACTIVE',
  });
  return { kind: 'handled' };
}

async function handleSubscriptionUpdated(
  event: PayPalEventLike,
  deps: WebhookDeps,
): Promise<WebhookResult> {
  const resource = event.resource;
  const subscriptionId = stringField(resource, 'id');
  const planId = stringField(resource, 'plan_id');

  if (!subscriptionId) return { kind: 'ignored', reason: 'missing-subscription-id' };

  const user = await deps.findUserBySubscriptionId(subscriptionId);
  if (!user) {
    deps.log({
      kind: 'webhook-orphan-subscription-updated',
      eventId: event.id,
      subscriptionId,
    });
    return { kind: 'ignored', reason: 'no-user-match' };
  }

  if (!planId) {
    deps.log({
      kind: 'webhook-missing-plan-id',
      eventId: event.id,
      subscriptionId,
    });
    return { kind: 'ignored', reason: 'missing-plan-id' };
  }

  const resolved = paypalPlanIdToPlan(planId);
  if (!resolved) {
    deps.log({
      kind: 'webhook-unknown-plan',
      eventId: event.id,
      subscriptionId,
      planId,
    });
    return { kind: 'ignored', reason: 'unknown-plan' };
  }

  const status = readSubscriptionStatus(resource);
  await deps.updateUser(user.id, {
    plan: resolved.plan,
    paypalSubscriptionStatus: status,
  });
  return { kind: 'handled' };
}

async function handlePaymentFailed(
  event: PayPalEventLike,
  deps: WebhookDeps,
): Promise<WebhookResult> {
  const resource = event.resource;
  const subscriptionId = stringField(resource, 'id');

  if (!subscriptionId) return { kind: 'ignored', reason: 'missing-subscription-id' };

  const user = await deps.findUserBySubscriptionId(subscriptionId);
  if (!user) {
    deps.log({
      kind: 'webhook-orphan-payment-failed',
      eventId: event.id,
      subscriptionId,
    });
    return { kind: 'ignored', reason: 'no-user-match' };
  }

  await deps.updateUser(user.id, { paypalSubscriptionStatus: 'SUSPENDED' });
  return { kind: 'handled' };
}

async function handleSubscriptionCancelled(
  event: PayPalEventLike,
  deps: WebhookDeps,
): Promise<WebhookResult> {
  const resource = event.resource;
  const subscriptionId = stringField(resource, 'id');

  if (!subscriptionId) return { kind: 'ignored', reason: 'missing-subscription-id' };

  const user = await deps.findUserBySubscriptionId(subscriptionId);
  if (!user) {
    deps.log({
      kind: 'webhook-orphan-subscription-cancelled',
      eventId: event.id,
      subscriptionId,
    });
    return { kind: 'ignored', reason: 'no-user-match' };
  }

  await deps.updateUser(user.id, {
    plan: 'trial',
    paypalSubscriptionId: null,
    paypalSubscriptionStatus: 'CANCELLED',
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

function readPayerId(resource: Record<string, unknown>): string | null {
  const subscriber = resource.subscriber as { payer_id?: unknown } | undefined;
  return typeof subscriber?.payer_id === 'string' && subscriber.payer_id.length > 0
    ? subscriber.payer_id
    : null;
}

function readSubscriberEmail(resource: Record<string, unknown>): string | null {
  const subscriber = resource.subscriber as { email_address?: unknown } | undefined;
  return typeof subscriber?.email_address === 'string' && subscriber.email_address.length > 0
    ? subscriber.email_address
    : null;
}

function readSubscriptionStatus(resource: Record<string, unknown>): 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' {
  const status = stringField(resource, 'status');
  if (status === 'ACTIVE' || status === 'SUSPENDED' || status === 'CANCELLED') {
    return status;
  }
  return 'ACTIVE';
}
