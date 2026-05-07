import { describe, expect, it, vi } from 'vitest';

import { handleStripeWebhook } from './handle-stripe-webhook';
import type { StripeEventLike, WebhookDeps } from './handle-stripe-webhook';

function makeDeps(overrides: Partial<WebhookDeps> = {}): WebhookDeps {
  const events = new Set<string>();
  return {
    isEventProcessed: vi.fn(async (id: string) => events.has(id)),
    markEventProcessed: vi.fn(async (id: string) => {
      events.add(id);
    }),
    findUserByCustomerId: vi.fn(async () => ({ id: 1, email: 'a@b.test' })),
    findUserByEmail: vi.fn(async () => null),
    updateUser: vi.fn(async () => undefined),
    pauseUserProfiles: vi.fn(async () => 0),
    log: vi.fn(),
    ...overrides,
  };
}

function event(over: Partial<StripeEventLike> & { id: string; type: string }): StripeEventLike {
  return {
    data: { object: {} as Record<string, unknown> },
    ...over,
  };
}

describe('handleStripeWebhook', () => {
  describe('idempotency', () => {
    it('returns `duplicate` and short-circuits when the event id is already logged', async () => {
      const deps = makeDeps({
        isEventProcessed: vi.fn(async () => true),
      });
      const result = await handleStripeWebhook({
        event: event({
          id: 'evt_1',
          type: 'checkout.session.completed',
          data: { object: { customer: 'cus_1', subscription: 'sub_1' } },
        }),
        deps,
      });
      expect(result.kind).toBe('duplicate');
      expect(deps.updateUser).not.toHaveBeenCalled();
      expect(deps.markEventProcessed).not.toHaveBeenCalled();
    });

    it('marks the event as processed after a successful handle', async () => {
      const deps = makeDeps();
      const result = await handleStripeWebhook({
        event: event({
          id: 'evt_2',
          type: 'checkout.session.completed',
          data: {
            object: { customer: 'cus_1', subscription: 'sub_1' },
          },
        }),
        deps,
      });
      expect(result.kind).toBe('handled');
      expect(deps.markEventProcessed).toHaveBeenCalledWith('evt_2', 'checkout.session.completed');
    });
  });

  describe('checkout.session.completed', () => {
    it('flips plan -> pro and stores subscription id', async () => {
      const deps = makeDeps();
      await handleStripeWebhook({
        event: event({
          id: 'evt_3',
          type: 'checkout.session.completed',
          data: {
            object: {
              customer: 'cus_1',
              subscription: 'sub_1',
              customer_email: 'a@b.test',
            },
          },
        }),
        deps,
      });
      expect(deps.updateUser).toHaveBeenCalledWith(1, {
        plan: 'pro',
        stripeCustomerId: 'cus_1',
        stripeSubscriptionId: 'sub_1',
        stripeSubscriptionStatus: 'active',
      });
    });

    it('falls back to email lookup when no Users row matches the customer id yet', async () => {
      // Stripe occasionally fires customer.subscription.created before
      // checkout.session.completed; conversely, on first checkout the
      // customer id is brand-new and the row hasn't been written until
      // we get the session event. Match by email as a fallback.
      const deps = makeDeps({
        findUserByCustomerId: vi.fn(async () => null),
        findUserByEmail: vi.fn(async () => ({ id: 7, email: 'a@b.test' })),
      });
      const result = await handleStripeWebhook({
        event: event({
          id: 'evt_4',
          type: 'checkout.session.completed',
          data: {
            object: {
              customer: 'cus_new',
              subscription: 'sub_new',
              customer_email: 'a@b.test',
            },
          },
        }),
        deps,
      });
      expect(result.kind).toBe('handled');
      expect(deps.updateUser).toHaveBeenCalledWith(7, expect.objectContaining({
        plan: 'pro',
        stripeCustomerId: 'cus_new',
      }));
    });

    it('returns `ignored` and logs when no user can be matched (Stripe will retry)', async () => {
      const deps = makeDeps({
        findUserByCustomerId: vi.fn(async () => null),
        findUserByEmail: vi.fn(async () => null),
      });
      const result = await handleStripeWebhook({
        event: event({
          id: 'evt_5',
          type: 'checkout.session.completed',
          data: {
            object: {
              customer: 'cus_orphan',
              subscription: 'sub_orphan',
              customer_email: 'ghost@nowhere.test',
            },
          },
        }),
        deps,
      });
      // We mark it processed anyway — Stripe retries on non-2xx, and we
      // don't want the same event to spin forever. The log line is the
      // operator escalation channel.
      expect(result.kind).toBe('ignored');
      expect(deps.log).toHaveBeenCalled();
      expect(deps.updateUser).not.toHaveBeenCalled();
    });
  });

  describe('invoice.payment_failed', () => {
    it('mirrors status -> past_due but does NOT pause profiles (Stripe is still retrying)', async () => {
      const deps = makeDeps();
      const result = await handleStripeWebhook({
        event: event({
          id: 'evt_6',
          type: 'invoice.payment_failed',
          data: { object: { customer: 'cus_1', subscription: 'sub_1' } },
        }),
        deps,
      });
      expect(result.kind).toBe('handled');
      expect(deps.updateUser).toHaveBeenCalledWith(1, {
        stripeSubscriptionStatus: 'past_due',
      });
      expect(deps.pauseUserProfiles).not.toHaveBeenCalled();
    });
  });

  describe('customer.subscription.deleted', () => {
    it('downgrades plan, clears subscription id, pauses profiles, queues an email log', async () => {
      const deps = makeDeps({
        pauseUserProfiles: vi.fn(async () => 2),
      });
      const result = await handleStripeWebhook({
        event: event({
          id: 'evt_7',
          type: 'customer.subscription.deleted',
          data: { object: { customer: 'cus_1', id: 'sub_1' } },
        }),
        deps,
      });
      expect(result.kind).toBe('handled');
      expect(deps.updateUser).toHaveBeenCalledWith(1, {
        plan: 'trial',
        stripeSubscriptionId: null,
        stripeSubscriptionStatus: 'canceled',
      });
      expect(deps.pauseUserProfiles).toHaveBeenCalledWith(1);
      expect(deps.log).toHaveBeenCalledWith(
        expect.objectContaining({ kind: 'subscription-canceled-email' }),
      );
    });
  });

  describe('customer.subscription.created/updated (task-31)', () => {
    const ENV = {
      STRIPE_PRICE_ID_PRO_MONTHLY: 'price_pro_m',
      STRIPE_PRICE_ID_PRO_ANNUAL: 'price_pro_a',
      STRIPE_PRICE_ID_AGENCY_MONTHLY: 'price_ag_m',
      STRIPE_PRICE_ID_AGENCY_ANNUAL: 'price_ag_a',
    };

    function subEvent(
      type: 'customer.subscription.created' | 'customer.subscription.updated',
      priceId: string,
      status = 'active',
    ): StripeEventLike {
      return {
        id: `evt_sub_${type}_${priceId}`,
        type,
        data: {
          object: {
            id: 'sub_99',
            customer: 'cus_1',
            status,
            items: { data: [{ price: { id: priceId } }] },
          },
        },
      };
    }

    it('flips Users.plan to pro on subscription.created with the pro price', async () => {
      for (const [k, v] of Object.entries(ENV)) vi.stubEnv(k, v);
      const deps = makeDeps();
      const result = await handleStripeWebhook({
        event: subEvent('customer.subscription.created', 'price_pro_m'),
        deps,
      });
      expect(result.kind).toBe('handled');
      expect(deps.updateUser).toHaveBeenCalledWith(1, {
        plan: 'pro',
        stripeSubscriptionId: 'sub_99',
        stripeSubscriptionStatus: 'active',
      });
      vi.unstubAllEnvs();
    });

    it('flips Users.plan to agency on subscription.updated with the agency price', async () => {
      for (const [k, v] of Object.entries(ENV)) vi.stubEnv(k, v);
      const deps = makeDeps();
      const result = await handleStripeWebhook({
        event: subEvent('customer.subscription.updated', 'price_ag_a'),
        deps,
      });
      expect(result.kind).toBe('handled');
      expect(deps.updateUser).toHaveBeenCalledWith(1, {
        plan: 'agency',
        stripeSubscriptionId: 'sub_99',
        stripeSubscriptionStatus: 'active',
      });
      vi.unstubAllEnvs();
    });

    it('ignores subscriptions referencing an unknown price id (logs but no plan flip)', async () => {
      for (const [k, v] of Object.entries(ENV)) vi.stubEnv(k, v);
      const deps = makeDeps();
      const result = await handleStripeWebhook({
        event: subEvent('customer.subscription.updated', 'price_unknown'),
        deps,
      });
      expect(result.kind).toBe('ignored');
      expect(deps.updateUser).not.toHaveBeenCalled();
      expect(deps.log).toHaveBeenCalledWith(
        expect.objectContaining({ kind: 'webhook-unknown-price' }),
      );
      vi.unstubAllEnvs();
    });
  });

  describe('unhandled events', () => {
    it('returns `ignored` for any other event type', async () => {
      const deps = makeDeps();
      const result = await handleStripeWebhook({
        event: event({ id: 'evt_8', type: 'customer.created' }),
        deps,
      });
      expect(result.kind).toBe('ignored');
      // Still log the id so duplicate retries short-circuit.
      expect(deps.markEventProcessed).toHaveBeenCalledWith('evt_8', 'customer.created');
      expect(deps.updateUser).not.toHaveBeenCalled();
    });
  });
});
