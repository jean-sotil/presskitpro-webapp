'use client';

import Link from 'next/link';
import { useState } from 'react';

import { pricingCopy } from '@/lib/marketing/pricing-copy';
import {
  PLANS,
  priceForBilling,
  type BillingCycle,
  type PlanConfig,
} from '@/lib/pricing/plans';

import { AnnualToggle } from './AnnualToggle';

export interface PricingTableProps {
  /** True when a session is present at SSR time. */
  loggedIn: boolean;
}

export function PricingTable({ loggedIn }: PricingTableProps) {
  const [cycle, setCycle] = useState<BillingCycle>('monthly');

  function ctaHref(plan: PlanConfig): string {
    if (plan.id === 'trial') return plan.ctaCheckoutPath;
    // Cycle-aware CTA (task-31 PR-B) — annual cycle picks
    // `ctaCheckoutPathAnnual` when present, otherwise falls back to
    // the monthly path. Trial has no checkout flow regardless.
    const target =
      cycle === 'annual' && plan.ctaCheckoutPathAnnual
        ? plan.ctaCheckoutPathAnnual
        : plan.ctaCheckoutPath;
    if (loggedIn) return target;
    return `/login?next=${encodeURIComponent(target)}`;
  }

  return (
    <section className="border-b border-border px-6 py-16 md:px-12 md:py-24">
      <div className="flex flex-col items-start gap-6">
        <AnnualToggle initial="monthly" onChange={setCycle} />
      </div>
      <ol className="mt-12 grid gap-6 md:grid-cols-3">
        {PLANS.map((plan) => {
          const c = pricingCopy.plans[plan.id] as {
            name: string;
            tagline: string;
            cta: string;
            includes: readonly string[];
            eyebrow?: string;
          };
          const price = priceForBilling(plan, cycle);
          const isFeatured = Boolean(plan.featured);
          return (
            <li
              key={plan.id}
              className={`flex flex-col gap-6 border bg-surface p-6 md:p-8 ${
                isFeatured ? 'border-accent' : 'border-border'
              }`}
            >
              {c.eyebrow ? (
                <p className="font-display text-xs uppercase tracking-widest text-accent">
                  {c.eyebrow}
                </p>
              ) : null}
              <div>
                <h2 className="font-display text-3xl uppercase tracking-tight">
                  {c.name}
                </h2>
                <p className="mt-2 text-sm text-text-muted">{c.tagline}</p>
              </div>
              <p className="font-display text-4xl tracking-tight">
                {plan.id === 'trial' ? (
                  pricingCopy.free
                ) : (
                  <>
                    <span>${price}</span>
                    <span className="ml-1 text-base text-text-muted">
                      {pricingCopy.perMonth}
                    </span>
                  </>
                )}
              </p>
              <ul className="flex flex-col gap-2 text-sm">
                {c.includes.map((line) => (
                  <li key={line} className="flex items-start gap-2">
                    <span aria-hidden="true" className="text-accent">
                      ✓
                    </span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto">
                <Link
                  href={ctaHref(plan)}
                  className={`inline-flex h-12 w-full items-center justify-center px-6 font-display text-sm uppercase tracking-wider transition-colors duration-quick ${
                    isFeatured
                      ? 'bg-accent text-accent-contrast hover:brightness-110'
                      : 'border border-border text-text hover:bg-bg'
                  } focus-visible:outline-offset-4`}
                >
                  {c.cta}
                </Link>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
