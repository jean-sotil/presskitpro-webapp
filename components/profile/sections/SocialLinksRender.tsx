'use client';

import { useTranslations } from 'next-intl';

import type { EditorBundle } from '@/lib/editor/bundle';
import type { Preset } from '@/lib/presets';

import { SocialLinksEditorialNightlifeV1 } from './editorial-nightlife-v1/SocialLinksRender.editorial-nightlife-v1';
import { SocialLinksElectricFireTechno } from './electric-fire-techno/SocialLinksRender.electric-fire-techno';
import { SocialLinksFestivalClubOrange } from './festival-club-orange/SocialLinksRender.festival-club-orange';
import { SocialLinksMediakitProV1 } from './mediakit-pro-v1/SocialLinksRender.mediakit-pro-v1';
import { SocialLinksDeadSignal } from './dead-signal/SocialLinksRender.dead-signal';
import { SocialLinksBunker909 } from './bunker-909/SocialLinksRender.social-links.bunker-909';
import { TrackedSocialLink } from './TrackedSocialLink';

type LinkRow = {
  id: number | string;
  platform: string;
  url: string;
  displayOrder?: number;
};

export function SocialLinksRender({
  bundle,
  preset,
}: {
  bundle: EditorBundle;
  preset?: Preset | null;
}) {
  const t = useTranslations('profile.social');
  const tPlatforms = useTranslations('profile.social.platforms');

  // Folder-owned preset dispatch.
  if (preset?.id === 'bunker-909') return <SocialLinksBunker909 bundle={bundle} />;
  if (preset?.id === 'dead-signal') return <SocialLinksDeadSignal bundle={bundle} />;
  if (preset?.id === 'electric-fire-techno')
    return <SocialLinksElectricFireTechno bundle={bundle} />;
  if (preset?.id === 'mediakit-pro-v1') return <SocialLinksMediakitProV1 bundle={bundle} />;
  if (preset?.id === 'festival-club-orange')
    return <SocialLinksFestivalClubOrange bundle={bundle} />;
  if (preset?.id === 'editorial-nightlife-v1')
    return <SocialLinksEditorialNightlifeV1 bundle={bundle} />;

  // No preset → unstyled pill-list fallback for legacy profiles.
  const raw = (bundle.socialLinks ?? []) as unknown as LinkRow[];
  if (!raw.length) return null;
  const links = [...raw].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  const profileSlug = bundle.profile.slug;
  return (
    <section className="border-b border-border px-6 py-16 md:px-12">
      <h2 className="font-display text-2xl uppercase tracking-tight">{t('label')}</h2>
      <ul className="mt-6 flex flex-wrap gap-3">
        {links.map((link) => {
          const href = hrefFor(link);
          let label: string;
          try {
            label = tPlatforms(link.platform);
          } catch {
            label = link.platform;
          }
          const external = link.platform !== 'email' && link.platform !== 'whatsapp';
          return (
            <li key={String(link.id)}>
              <TrackedSocialLink
                href={href}
                platform={link.platform}
                profileSlug={profileSlug}
                target={external ? '_blank' : undefined}
                rel={external ? 'noopener noreferrer' : undefined}
                className="inline-flex h-10 items-center border border-border px-4 text-xs uppercase tracking-wider text-text-muted hover:text-text"
              >
                {label}
              </TrackedSocialLink>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** The canonical URL stored by the editor is already in the right shape
 *  (`mailto:...`, `https://wa.me/...`, etc.) — but data from older saves
 *  or admin tweaks might not be, so we coerce defensively. */
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
