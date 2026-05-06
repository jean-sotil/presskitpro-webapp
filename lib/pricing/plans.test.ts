import { describe, expect, it } from 'vitest';

import { PLANS, getPlan, priceForBilling } from './plans';

describe('PLANS', () => {
  it('exposes the three tiers from PRD §16', () => {
    expect(PLANS.map((p) => p.id)).toEqual(['trial', 'pro', 'agency']);
  });

  it('marks Pro as the featured tier', () => {
    expect(PLANS.find((p) => p.id === 'pro')?.featured).toBe(true);
    expect(PLANS.find((p) => p.id === 'trial')?.featured).toBeFalsy();
    expect(PLANS.find((p) => p.id === 'agency')?.featured).toBeFalsy();
  });
});

describe('getPlan', () => {
  it('returns the plan by id', () => {
    expect(getPlan('pro')?.id).toBe('pro');
  });
  it('returns undefined for unknown ids', () => {
    expect(getPlan('unknown' as never)).toBeUndefined();
  });
});

describe('priceForBilling', () => {
  const trial = getPlan('trial')!;
  const pro = getPlan('pro')!;
  const agency = getPlan('agency')!;

  it('returns the monthly price by default', () => {
    expect(priceForBilling(pro, 'monthly')).toBe(pro.priceUSD);
    expect(priceForBilling(agency, 'monthly')).toBe(agency.priceUSD);
  });

  it('returns the annual price for annual cycle on Pro', () => {
    expect(priceForBilling(pro, 'annual')).toBe(pro.priceUSDAnnual);
  });

  it('returns 0 for the trial regardless of cycle', () => {
    expect(priceForBilling(trial, 'monthly')).toBe(0);
    expect(priceForBilling(trial, 'annual')).toBe(0);
  });

  it('falls back to monthly when annual is missing on a tier', () => {
    expect(priceForBilling(agency, 'annual')).toBe(agency.priceUSD);
  });
});
