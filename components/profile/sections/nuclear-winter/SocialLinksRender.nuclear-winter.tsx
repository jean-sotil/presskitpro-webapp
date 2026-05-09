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
 * Terminal-style links with radioactive hover glow and coordinate annotations.
 */
export function SocialLinksNuclearWinter({ bundle }: { bundle: EditorBundle }) {
  const tPlatforms = useTranslations('profile.social.platforms');

  const raw = (bundle.socialLinks ?? []) as unknown as LinkRow[];
  if (!raw.length) return null;

  const links = [...raw].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  const profileSlug = bundle.profile.slug;

  return (
    <section className="relative border-b border-[#39ff14]/10 bg-black px-6 py-20 font-mono md:px-12 md:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 flex items-center justify-between border-b border-[#39ff14]/10 pb-8">
           <h2 className="font-display text-4xl uppercase tracking-tighter text-white md:text-6xl">
             LINK<span className="text-[#39ff14]">.</span>ARRAY
           </h2>
           <div className="text-right text-[10px] tracking-[0.3em] text-[#39ff14]/30 uppercase">
              STATUS: SIGNAL_LOCKED<br />
              COUNT: {links.length.toString().padStart(2, '0')}
           </div>
        </div>

        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
              <li key={String(link.id)} className="group">
                <TrackedSocialLink
                  href={href}
                  platform={link.platform}
                  profileSlug={profileSlug}
                  target={external ? '_blank' : undefined}
                  rel={external ? 'noopener noreferrer' : undefined}
                  className="flex flex-col items-start border border-[#39ff14]/20 bg-[#050705] p-6 transition-all group-hover:border-[#39ff14] group-hover:shadow-[0_0_15px_rgba(57,255,20,0.1)]"
                >
                  <div className="mb-8 flex w-full items-center justify-between text-[9px] font-bold text-[#333] transition-colors group-hover:text-[#39ff14]/50">
                    <span>NODE_{i.toString().padStart(2, '0')}</span>
                    <span className="opacity-0 transition-opacity group-hover:opacity-100">ACCESS_GRANTED</span>
                  </div>
                  <span className="text-xl font-bold uppercase tracking-[0.2em] text-white transition-colors group-hover:text-[#39ff14]">
                    {label}
                  </span>
                  <div className="mt-4 h-0.5 w-0 bg-[#39ff14] transition-all duration-300 group-hover:w-full" />
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
