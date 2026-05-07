import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { switchPlan, type SwitchPlanDeps } from './switch-plan';

const ENV = {
  STRIPE_PRICE_ID_PRO_MONTHLY: 'price_pro_m',
  STRIPE_PRICE_ID_PRO_ANNUAL: 'price_pro_a',
  STRIPE_PRICE_ID_AGENCY_MONTHLY: 'price_ag_m',
  STRIPE_PRICE_ID_AGENCY_ANNUAL: 'price_ag_a',
};

function makeDeps(overrides: Partial<SwitchPlanDeps> = {}): SwitchPlanDeps {
  const subUpdate = vi.fn(async () => ({ id: 'sub_1', status: 'active' }));
  const subRetrieve = vi.fn(async () => ({
    id: 'sub_1',
    status: 'active',
    items: { data: [{ id: 'si_1', price: { id: 'price_pro_m' } }] },
  }));
  return {
    findUser: vi.fn(async () => ({
      id: 1,
      stripeSubscriptionId: 'sub_1',
    })),
    stripe: {
      subscriptions: {
        retrieve: subRetrieve,
        update: subUpdate,
      },
    } as never,
    ...overrides,
  };
}

describe('switchPlan', () => {
  beforeEach(() => {
    for (const [k, v] of Object.entries(ENV)) vi.stubEnv(k, v);
  });
  afterEach(() => vi.unstubAllEnvs());

  it('updates the existing subscription with the new price + proration', async () => {
    const deps = makeDeps();
    const r = await switchPlan({
      userId: 1,
      planKey: 'pro-annual',
      deps,
    });
    expect(r.ok).toBe(true);
    expect(deps.stripe.subscriptions.update).toHaveBeenCalledTimes(1);
    expect(deps.stripe.subscriptions.update).toHaveBeenCalledWith('sub_1', {
      items: [{ id: 'si_1', price: 'price_pro_a' }],
      proration_behavior: 'create_prorations',
    });
  });

  it('refuses an unknown plan key', async () => {
    const deps = makeDeps();
    const r = await switchPlan({
      userId: 1,
      planKey: 'enterprise-monthly' as never,
      deps,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('unknown-plan');
    expect(deps.stripe.subscriptions.update).not.toHaveBeenCalled();
  });

  it('refuses when the user has no existing subscription', async () => {
    const deps = makeDeps({
      findUser: vi.fn(async () => ({ id: 1, stripeSubscriptionId: null })),
    });
    const r = await switchPlan({
      userId: 1,
      planKey: 'pro-annual',
      deps,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('no-subscription');
  });

  it('refuses when the configured price id env is missing', async () => {
    vi.stubEnv('STRIPE_PRICE_ID_AGENCY_ANNUAL', '');
    const deps = makeDeps();
    const r = await switchPlan({
      userId: 1,
      planKey: 'agency-annual',
      deps,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('not-configured');
  });

  it('refuses when the user is not found', async () => {
    const deps = makeDeps({
      findUser: vi.fn(async () => null),
    });
    const r = await switchPlan({
      userId: 999,
      planKey: 'pro-annual',
      deps,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('user-not-found');
  });

  it('returns stripe-error when the Stripe call throws', async () => {
    const deps = makeDeps({
      stripe: {
        subscriptions: {
          retrieve: vi.fn(async () => ({
            id: 'sub_1',
            items: { data: [{ id: 'si_1', price: { id: 'price_pro_m' } }] },
          })),
          update: vi.fn(async () => {
            throw new Error('Stripe down');
          }),
        },
      } as never,
    });
    const r = await switchPlan({
      userId: 1,
      planKey: 'pro-annual',
      deps,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('stripe-error');
  });
});
