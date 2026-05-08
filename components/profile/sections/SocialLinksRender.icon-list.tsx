'use client';

import { useTranslations } from 'next-intl';

import type { EditorBundle } from '@/lib/editor/bundle';

import { TrackedSocialLink } from './TrackedSocialLink';

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
export function SocialLinksIconList({ bundle }: { bundle: EditorBundle }) {
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
            02 — {t('label')}
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

const ICON_PROPS = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

function PlatformIcon({ platform }: { platform: string }) {
  switch (platform) {
    case 'instagram':
      return (
        <svg {...ICON_PROPS}>
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'youtube':
      return (
        <svg {...ICON_PROPS}>
          <rect x="2" y="5" width="20" height="14" rx="3" />
          <path d="M10 9l5 3-5 3z" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'soundcloud':
      return (
        <svg {...ICON_PROPS}>
          <path d="M3 14v4M6 12v6M9 10v8M12 8v10M15 10v8c2 0 4-1 4-4s-2-4-4-4" />
        </svg>
      );
    case 'spotify':
      return (
        <svg {...ICON_PROPS}>
          <circle cx="12" cy="12" r="9" />
          <path d="M7 9.5c3-1 7-1 10 0.5M7.5 13c2.5-0.7 5.5-0.5 8 0.7M8 16c2-0.5 4-0.4 6 0.4" />
        </svg>
      );
    case 'tiktok':
      return (
        <svg {...ICON_PROPS}>
          <path d="M14 4v10a4 4 0 1 1-4-4" />
          <path d="M14 4c1 2 3 3 5 3" />
        </svg>
      );
    case 'twitter':
      return (
        <svg {...ICON_PROPS}>
          <path d="M4 4l7 9-7 7h2l6-6 5 6h4l-8-10 7-6h-2l-6 5-4-5z" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'whatsapp':
      return (
        <svg {...ICON_PROPS}>
          <path d="M21 12a9 9 0 0 1-13.5 7.8L3 21l1.3-4.4A9 9 0 1 1 21 12z" />
          <path d="M8.5 9c0 4 3 6.5 6.5 6.5l1.5-1.5-2-1.5-1 1c-1-0.5-2-1.5-2.5-2.5l1-1-1.5-2L9 8z" />
        </svg>
      );
    case 'email':
      return (
        <svg {...ICON_PROPS}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 7l9 6 9-6" />
        </svg>
      );
    default:
      return (
        <svg {...ICON_PROPS}>
          <path d="M10 14a3 3 0 0 0 4 0l3-3a3 3 0 0 0-4-4l-1 1" />
          <path d="M14 10a3 3 0 0 0-4 0l-3 3a3 3 0 0 0 4 4l1-1" />
        </svg>
      );
  }
}
