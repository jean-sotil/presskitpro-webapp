'use client';

import { useState } from 'react';

import type { BillingCycle } from '@/lib/pricing/plans';
import { pricingCopy } from '@/lib/marketing/pricing-copy';

export interface AnnualToggleProps {
  initial?: BillingCycle;
  onChange?: (cycle: BillingCycle) => void;
}

/**
 * Monthly / Annual toggle. v1 placeholder per spec — swaps the
 * displayed price via the optional `onChange` callback. Task-31 wires
 * the annual Stripe Price ID and updates the CTA href.
 */
export function AnnualToggle({ initial = 'monthly', onChange }: AnnualToggleProps) {
  const [cycle, setCycle] = useState<BillingCycle>(initial);

  function set(next: BillingCycle) {
    setCycle(next);
    onChange?.(next);
  }

  return (
    <div className="inline-flex items-center gap-2">
      <div
        role="tablist"
        aria-label="Ciclo de cobrança"
        className="inline-flex border border-border bg-bg p-1"
      >
        <button
          type="button"
          role="tab"
          aria-selected={cycle === 'monthly'}
          onClick={() => set('monthly')}
          className={`px-3 py-1 text-xs uppercase tracking-wider ${
            cycle === 'monthly' ? 'bg-accent text-accent-contrast' : 'text-text-muted'
          }`}
        >
          {pricingCopy.toggle.monthly}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={cycle === 'annual'}
          onClick={() => set('annual')}
          className={`px-3 py-1 text-xs uppercase tracking-wider ${
            cycle === 'annual' ? 'bg-accent text-accent-contrast' : 'text-text-muted'
          }`}
        >
          {pricingCopy.toggle.annual}
        </button>
      </div>
      {cycle === 'annual' ? (
        <span className="text-xs text-text-muted" title={pricingCopy.toggle.hint}>
          {pricingCopy.toggle.hint}
        </span>
      ) : null}
    </div>
  );
}
