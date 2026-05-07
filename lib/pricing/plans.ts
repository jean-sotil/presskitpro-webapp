/**
 * Single source of truth for the pricing tiers (task-22, PRD §16).
 *
 * Display values live next to the Stripe Price ID env-var names so they
 * can never drift. Task-23's Stripe Checkout integration reads the same
 * `stripePriceIdEnv` to look up the live Stripe ID at request time.
 *
 * Pure module — safe for RSC + client + tests.
 */

export type PlanId = 'trial' | 'pro' | 'agency';
export type BillingCycle = 'monthly' | 'annual';

export interface PlanConfig {
  id: PlanId;
  /** Display price in USD (per month). 0 for the free trial. */
  priceUSD: number;
  /** Display price in USD per month when billed annually. Optional. */
  priceUSDAnnual?: number;
  /** Env var name holding the Stripe Price ID for monthly billing.
   *  `null` for the trial (no checkout). Task-23 reads this. */
  stripePriceIdEnv: string | null;
  /** Env var for annual Stripe Price ID. Optional; tier may not have annual. */
  stripePriceIdAnnualEnv?: string;
  /** Path the CTA navigates to after auth (monthly cadence). The page
   *  wraps this in `/login?next=...` for logged-out users. */
  ctaCheckoutPath: string;
  /** Annual checkout path for tiers that offer annual billing. When
   *  unset, the pricing table falls back to `ctaCheckoutPath`. */
  ctaCheckoutPathAnnual?: string;
  /** True for the recommended tier — gets visual emphasis. */
  featured?: boolean;
}

export const PLANS: PlanConfig[] = [
  {
    id: 'trial',
    priceUSD: 0,
    priceUSDAnnual: 0,
    stripePriceIdEnv: null,
    ctaCheckoutPath: '/signup',
  },
  {
    id: 'pro',
    priceUSD: 12,
    priceUSDAnnual: 10,
    stripePriceIdEnv: 'STRIPE_PRICE_ID_PRO_MONTHLY',
    stripePriceIdAnnualEnv: 'STRIPE_PRICE_ID_PRO_ANNUAL',
    ctaCheckoutPath: '/checkout/pro-monthly',
    ctaCheckoutPathAnnual: '/checkout/pro-annual',
    featured: true,
  },
  {
    id: 'agency',
    priceUSD: 39,
    // ~2 months free off the monthly cadence (39 × 10 / 12 = 32.5 → 33).
    priceUSDAnnual: 33,
    // task-31 — `STRIPE_PRICE_ID_AGENCY_MONTHLY` is the new name; the
    // legacy `STRIPE_PRICE_ID_AGENCY` is honored as a fallback by
    // `priceIdToPlan` for one rolling-deploy release. Drop the legacy
    // env once every deploy migrates.
    stripePriceIdEnv: 'STRIPE_PRICE_ID_AGENCY_MONTHLY',
    stripePriceIdAnnualEnv: 'STRIPE_PRICE_ID_AGENCY_ANNUAL',
    ctaCheckoutPath: '/checkout/agency-monthly',
    ctaCheckoutPathAnnual: '/checkout/agency-annual',
  },
];

export function getPlan(id: PlanId): PlanConfig | undefined {
  return PLANS.find((p) => p.id === id);
}

export function priceForBilling(plan: PlanConfig, cycle: BillingCycle): number {
  if (plan.id === 'trial') return 0;
  if (cycle === 'annual') return plan.priceUSDAnnual ?? plan.priceUSD;
  return plan.priceUSD;
}
