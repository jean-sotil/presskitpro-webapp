import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { priceIdToPlan } from './price-id-to-plan';

const ENV = {
  STRIPE_PRICE_ID_PRO_MONTHLY: 'price_pro_m',
  STRIPE_PRICE_ID_PRO_ANNUAL: 'price_pro_a',
  STRIPE_PRICE_ID_AGENCY_MONTHLY: 'price_ag_m',
  STRIPE_PRICE_ID_AGENCY_ANNUAL: 'price_ag_a',
  // Legacy single-name fallback covered by R1 in the plan.
  STRIPE_PRICE_ID_AGENCY: 'price_ag_legacy',
};

describe('priceIdToPlan', () => {
  beforeEach(() => {
    for (const [k, v] of Object.entries(ENV)) vi.stubEnv(k, v);
  });
  afterEach(() => vi.unstubAllEnvs());

  it('maps the four canonical price ids', () => {
    expect(priceIdToPlan('price_pro_m')).toEqual({ plan: 'pro', cycle: 'monthly' });
    expect(priceIdToPlan('price_pro_a')).toEqual({ plan: 'pro', cycle: 'annual' });
    expect(priceIdToPlan('price_ag_m')).toEqual({ plan: 'agency', cycle: 'monthly' });
    expect(priceIdToPlan('price_ag_a')).toEqual({ plan: 'agency', cycle: 'annual' });
  });

  it('honors the legacy STRIPE_PRICE_ID_AGENCY env as agency monthly (rolling-deploy fallback)', () => {
    expect(priceIdToPlan('price_ag_legacy'))
      .toEqual({ plan: 'agency', cycle: 'monthly' });
  });

  it('returns null for an unknown price id', () => {
    expect(priceIdToPlan('price_unknown_xyz')).toBeNull();
    expect(priceIdToPlan('')).toBeNull();
  });

  it('skips env lookups whose values are missing or empty', () => {
    vi.stubEnv('STRIPE_PRICE_ID_PRO_MONTHLY', '');
    // The shared price_pro_m id no longer matches an env var, so the
    // mapping returns null even though the literal looks like ours.
    expect(priceIdToPlan('price_pro_m')).toBeNull();
  });
});
