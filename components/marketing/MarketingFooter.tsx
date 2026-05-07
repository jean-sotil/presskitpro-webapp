import Link from 'next/link';
import { useTranslations } from 'next-intl';

type FooterLink = { label: string; href: string };

export function MarketingFooter() {
  const t = useTranslations('footer');
  const navLinks = Object.values(t.raw('nav') as Record<string, FooterLink>);
  const socialLinks = Object.values(t.raw('social') as Record<string, FooterLink>);
  return (
    <footer className="px-6 py-12 md:px-12">
      <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="font-display text-2xl uppercase tracking-tight">
            PressKit Pro
          </p>
          <p className="mt-2 text-sm text-text-muted">{t('tagline')}</p>
        </div>
        <nav aria-label={t('navLabel')}>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-xs uppercase tracking-wider text-text-muted">
            {navLinks.map((link) => (
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
        <ul className="flex flex-wrap gap-x-4 gap-y-1 uppercase tracking-wider">
          {socialLinks.map((s) => (
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
        <p>{t('copyright')}</p>
      </div>
    </footer>
  );
}
