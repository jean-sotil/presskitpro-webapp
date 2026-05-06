import { pricingCopy } from '@/lib/marketing/pricing-copy';

export function PricingFaq() {
  return (
    <section className="border-b border-border px-6 py-16 md:px-12 md:py-24">
      <p className="font-display text-xs uppercase tracking-widest text-text-muted">
        {pricingCopy.faq.eyebrow}
      </p>
      <h2 className="mt-4 font-display text-3xl uppercase tracking-tight md:text-5xl">
        {pricingCopy.faq.title}
      </h2>
      <ul className="mt-12 max-w-3xl divide-y divide-border border-y border-border">
        {pricingCopy.faq.items.map((item) => (
          <li key={item.q}>
            <details className="group">
              <summary className="flex cursor-pointer items-center justify-between py-5 text-left font-display text-base uppercase tracking-tight md:text-lg">
                <span>{item.q}</span>
                <span
                  aria-hidden="true"
                  className="text-2xl text-text-muted transition-transform duration-quick group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="pb-5 text-sm text-text-muted">{item.a}</p>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}
