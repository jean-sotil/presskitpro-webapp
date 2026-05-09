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
 * [PRESET-NAME] social links section template
 *
 * Replace this description with your preset's social-links design
 * philosophy. Click-tracking is owned by `<TrackedSocialLink>` — never
 * render a raw `<a>` for these.
 *
 * Key points to document:
 *   - Layout (pill list, icon list, button grid, stat cards)
 *   - Whether platform stats / followers / handles are surfaced
 *   - Hover treatment + focus ring
 *   - Any CSS data attributes used for styling
 *
 * Code pattern:
 *   - Pull `bundle.socialLinks`, sort by `displayOrder`
 *   - Return null when no links exist
 *   - Coerce email/whatsapp URLs via `hrefFor()` for legacy rows
 *   - Translate the platform label via `tPlatforms`; fall back to the raw key
 *   - Mark email/whatsapp as same-tab; everything else opens externally
 */
export function SocialLinks_TEMPLATE_PRESET({ bundle }: { bundle: EditorBundle }) {
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
      <div className="mx-auto max-w-3xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-text-muted">
          03 — {t('label')}
        </p>
        <h2
          className="mt-6 font-display uppercase leading-none tracking-tight text-text"
          style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
        >
          {t('label')}
        </h2>
        <ul className="mt-12 flex flex-wrap gap-3">
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
                  className="inline-flex h-10 items-center gap-2 border border-border px-4 text-xs uppercase tracking-wider text-text-muted hover:text-text"
                >
                  <PlatformIcon platform={link.platform} />
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

/** Coerce legacy email/whatsapp rows that may store a bare address. */
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
