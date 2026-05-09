'use client';

import { useTranslations } from 'next-intl';

import type { EditorBundle } from '@/lib/editor/bundle';

import { TrackedSocialLink } from '../TrackedSocialLink';

type LinkRow = {
  id: number | string;
  platform: string;
  url: string;
  displayOrder?: number;
};

/**
 * Nuclear Winter Social Links
 * Terminal-style links with cold signal hover glow and desolate annotations.
 */
export function SocialLinksNuclearWinter({ bundle }: { bundle: EditorBundle }) {
  const tPlatforms = useTranslations('profile.social.platforms');

  const raw = (bundle.socialLinks ?? []) as unknown as LinkRow[];
  if (!raw.length) return null;

  const links = [...raw].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  const profileSlug = bundle.profile.slug;

  return (
    <section className="relative border-b border-[#e0eaff]/5 bg-black px-8 py-24 font-mono md:px-16 md:py-40">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 flex items-center justify-between border-b border-[#e0eaff]/5 pb-12" data-reveal>
           <h2 className="font-display text-5xl uppercase tracking-tighter text-white md:text-8xl">
             LINK<span className="text-[#e0eaff]">.</span>RECEP
           </h2>
           <div className="text-right text-[10px] tracking-[0.5em] text-[#222] uppercase">
              SIG_LOCK: ESTABLISHED<br />
              NODES: {links.length.toString().padStart(2, '0')}
           </div>
        </div>

        <ul className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((link, i) => {
            const href = hrefFor(link);
            let label: string;
            try {
              label = tPlatforms(link.platform);
            } catch {
              label = link.platform;
            }
            const external = link.platform !== 'email' && link.platform !== 'whatsapp';

            return (
              <li key={String(link.id)} className="group" data-reveal style={{ '--reveal-index': i } as React.CSSProperties}>
                <TrackedSocialLink
                  href={href}
                  platform={link.platform}
                  profileSlug={profileSlug}
                  target={external ? '_blank' : undefined}
                  rel={external ? 'noopener noreferrer' : undefined}
                  className="fractured-border flex flex-col items-start bg-black/40 p-10 transition-all group-hover:bg-[#e0eaff]/5 group-hover:shadow-[0_0_25px_rgba(224,234,255,0.05)]"
                >
                  <div className="mb-10 flex w-full items-center justify-between text-[10px] font-bold text-[#1a1a1a] transition-colors group-hover:text-[#e0eaff]/40">
                    <span>NODE_{i.toString().padStart(2, '0')}</span>
                    <span className="opacity-0 transition-opacity group-hover:opacity-100 tracking-widest">ACCESSING...</span>
                  </div>
                  <span className="text-2xl font-bold uppercase tracking-[0.3em] text-white transition-colors group-hover:text-[#e0eaff]">
                    {label}
                  </span>
                  <div className="mt-6 h-0.5 w-0 bg-[#e0eaff]/40 transition-all duration-1000 group-hover:w-full" />
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
