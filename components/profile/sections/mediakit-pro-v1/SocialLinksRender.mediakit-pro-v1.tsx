'use client';

import { useTranslations } from 'next-intl';

import type { EditorBundle } from '@/lib/editor/bundle';

import { PlatformIcon } from '../PlatformIcon';
import { TrackedSocialLink } from '../TrackedSocialLink';

type LinkRow = {
  id: number | string;
  platform: string;
  url: string;
  displayOrder?: number;
};

/**
 * Hard Techno Underground social section — split 50/50 layout. The
 * left column carries a numbered "02 — SOCIAL MEDIA" marker plus the
 * platform list; each row pairs a 2rem circle-outlined icon with an
 * oversized uppercase platform label that flips to accent on hover.
 * The right column shows a stacked "follow" CTA card.
 *
 * Icons are inlined `currentColor` SVGs (no icon library = zero
 * bundle hit). Unknown platforms get a generic chain-link glyph.
 */
export function SocialLinksMediakitProV1({ bundle }: { bundle: EditorBundle }) {
  const t = useTranslations('profile.social');
  const tPlatforms = useTranslations('profile.social.platforms');
  const raw = (bundle.socialLinks ?? []) as unknown as LinkRow[];
  if (!raw.length) return null;
  const links = [...raw].sort(
    (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
  );
  const profileSlug = bundle.profile.slug;
  return (
    <section className="border-b border-border bg-bg px-6 py-20 md:px-12 md:py-32">
      <div className="grid gap-12 md:grid-cols-2 md:gap-16">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
            {t('label')}
          </p>
          <h2
            className="mt-6 font-display uppercase leading-none tracking-tight"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)' }}
          >
            {t('heading')}
          </h2>
          <ul className="mt-10 flex flex-col">
            {links.map((link) => {
              const href = hrefFor(link);
              let label: string;
              try {
                label = tPlatforms(link.platform);
              } catch {
                label = link.platform;
              }
              const external =
                link.platform !== 'email' && link.platform !== 'whatsapp';
              return (
                <li
                  key={String(link.id)}
                  className="border-t border-border last:border-b"
                >
                  <TrackedSocialLink
                    href={href}
                    platform={link.platform}
                    profileSlug={profileSlug}
                    target={external ? '_blank' : undefined}
                    rel={external ? 'noopener noreferrer' : undefined}
                    className="group flex items-center gap-5 py-5 text-text transition-colors duration-quick hover:text-accent"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-full border border-text-muted transition-colors duration-quick group-hover:border-accent group-hover:bg-accent group-hover:text-accent-contrast">
                      <PlatformIcon platform={link.platform} />
                    </span>
                    <span
                      className="font-display font-black uppercase tracking-wider"
                      style={{ fontSize: 'clamp(1.25rem, 3vw, 1.75rem)' }}
                    >
                      {label}
                    </span>
                  </TrackedSocialLink>
                </li>
              );
            })}
          </ul>
        </div>
        <aside className="flex flex-col justify-end border border-border bg-surface p-10">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
            presskit.pro/{profileSlug}
          </p>
          <p
            className="mt-6 whitespace-pre-line font-display uppercase leading-none tracking-tight text-text"
            style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)' }}
          >
            {t('asideHeading')}
          </p>
          <p className="mt-6 text-sm text-text-muted">{t('asideHint')}</p>
        </aside>
      </div>
    </section>
  );
}

function hrefFor(link: LinkRow): string {
  if (link.platform === 'email') {
    return link.url.startsWith('mailto:') ? link.url : `mailto:${link.url}`;
  }
  if (link.platform === 'whatsapp') {
    if (link.url.startsWith('http')) return link.url;
    const digits = link.url.replace(/\D/g, '');
    return `https://wa.me/${digits}`;
  }
  return link.url;
}

