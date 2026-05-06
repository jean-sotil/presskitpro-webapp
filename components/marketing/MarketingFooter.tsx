import Link from 'next/link';

import { copy } from '@/lib/marketing/copy';

export function MarketingFooter() {
  const f = copy.footer;
  return (
    <footer className="px-6 py-12 md:px-12">
      <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="font-display text-2xl uppercase tracking-tight">
            PressKit Pro
          </p>
          <p className="mt-2 text-sm text-text-muted">{f.tagline}</p>
        </div>
        <nav aria-label="Rodapé">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-xs uppercase tracking-wider text-text-muted">
            {Object.values(f.nav).map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-text">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6 text-xs text-text-muted">
        <div className="flex flex-wrap items-center gap-4">
          <span className="uppercase tracking-wider">{f.lang.label}</span>
          <div role="group" aria-label={f.lang.label} title={f.lang.hint}>
            <button
              type="button"
              aria-pressed="true"
              className="border border-border bg-surface px-3 py-1 uppercase tracking-wider"
            >
              {f.lang.pt}
            </button>
            <button
              type="button"
              aria-pressed="false"
              disabled
              className="ml-2 border border-border bg-bg px-3 py-1 uppercase tracking-wider text-text-muted opacity-50"
              title={f.lang.hint}
            >
              {f.lang.en}
            </button>
          </div>
        </div>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 uppercase tracking-wider">
          {Object.values(f.social).map((s) => (
            <li key={s.href}>
              <Link
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-text"
              >
                {s.label}
              </Link>
            </li>
          ))}
        </ul>
        <p>{f.copyright}</p>
      </div>
    </footer>
  );
}
