'use client';

import { useTranslations } from 'next-intl';

import type { EditorBundle } from '@/lib/editor/bundle';

import { PlatformIcon } from './PlatformIcon';
import { TrackedSocialLink } from './TrackedSocialLink';

type LinkRow = {
  id: number | string;
  platform: string;
  url: string;
  displayOrder?: number;
};

/**
 * Electric Fire Techno social section — centered 2-column grid of
 * outlined buttons. Each pill: cyan-glow border, transparent fill,
 * brand icon + uppercase label, hover floods cyan-tinted bg with
 * a brighter border + box-shadow halo. Per
 * docs/presets/MediakitPRO_template_3.json `socialMedia.button`.
 *
 * The cyan glow lives in globals.css scoped to
 * `[data-preset-electric-fire] [data-glow-buttons] a` so the
 * stylesheet owns the visual rule and the component stays focused
 * on data + structure.
 */
export function SocialLinksGlowButtons({ bundle }: { bundle: EditorBundle }) {
  const t = useTranslations('profile.social');
  const tPlatforms = useTranslations('profile.social.platforms');
  const raw = (bundle.socialLinks ?? []) as unknown as LinkRow[];
  if (!raw.length) return null;
  const links = [...raw].sort(
    (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
  );
  const profileSlug = bundle.profile.slug;

  return (
    <section
      data-glow-buttons
      className="border-b border-border bg-bg px-6 py-20 md:px-12 md:py-28"
    >
      <div className="mx-auto max-w-xl text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-text-muted">
          03 — {t('label')}
        </p>
        <h2
          data-fire-section-title
          className="mt-6 font-display uppercase leading-none tracking-tight"
          style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
        >
          {t('label')}
        </h2>
        <ul className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2">
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
              <li key={String(link.id)}>
                <TrackedSocialLink
                  href={href}
                  platform={link.platform}
                  profileSlug={profileSlug}
                  target={external ? '_blank' : undefined}
                  rel={external ? 'noopener noreferrer' : undefined}
                  className="group flex h-12 w-full items-center justify-center gap-3 border bg-transparent px-5 text-xs font-bold uppercase tracking-[0.18em] text-text transition-colors duration-quick"
                >
                  <span className="text-text transition-colors duration-quick">
                    <PlatformIcon platform={link.platform} />
                  </span>
                  <span>{label}</span>
                </TrackedSocialLink>
              </li>
            );
          })}
        </ul>
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
