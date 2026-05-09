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
 * Festival Club Orange social — split 55/45 on a hard-black band:
 *
 * Left column: editorial platform list. Each row has an accent-tinted
 * platform name, a mono URL fragment as the metric placeholder (we
 * don't track follower counts in the schema, so the URL stands in for
 * "evidence of presence"), and a row divider.
 *
 * Right column: a decorative SVG phone frame with a stylized social
 * grid inside — riffs on the spec's "Instagram screenshot mockup"
 * without requiring an actual screenshot upload. Tilted and gently
 * floating to break the page rhythm.
 *
 * The dark band creates the alternating-section pattern the festival
 * preset asks for, even though the rest of the preset is light cream.
 */
export function SocialLinksFestivalClubOrange({ bundle }: { bundle: EditorBundle }) {
  const t = useTranslations('profile.social');
  const tPlatforms = useTranslations('profile.social.platforms');
  const raw = (bundle.socialLinks ?? []) as unknown as LinkRow[];
  if (!raw.length) return null;
  const links = [...raw].sort(
    (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
  );
  const profileSlug = bundle.profile.slug;

  return (
    <section className="border-b border-border bg-bg px-6 py-20 md:px-12 md:py-28">
      <div className="grid gap-12 md:grid-cols-[55%_1fr] md:items-center md:gap-16">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
            {t('label')}
          </p>
          <h2
            className="mt-6 font-display uppercase leading-[0.9] tracking-[-0.02em] text-text"
            style={{ fontSize: 'clamp(2.5rem, 7vw, 5rem)' }}
          >
            Social
            <br />
            network
            <br />
            <span className="text-accent">stats</span>
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
                    className="group flex flex-wrap items-center justify-between gap-4 py-5"
                  >
                    <span
                      className="font-display font-black uppercase tracking-wider text-text transition-colors duration-quick group-hover:text-accent"
                      style={{ fontSize: 'clamp(1.25rem, 3vw, 1.75rem)' }}
                    >
                      {label}
                    </span>
                    <span className="font-mono text-xs uppercase tracking-[0.2em] text-text-muted">
                      {compactUrl(href)}
                    </span>
                  </TrackedSocialLink>
                </li>
              );
            })}
          </ul>
        </div>
        <PhoneFrame slug={profileSlug} />
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

/** Shortens a URL to a "host/handle" form for compact display in the
 *  metric column. Falls back to the raw URL when parsing fails. */
function compactUrl(url: string): string {
  try {
    if (url.startsWith('mailto:')) return url.replace('mailto:', '');
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    const path = u.pathname.replace(/\/$/, '');
    return `${u.host.replace(/^www\./, '')}${path}`;
  } catch {
    return url;
  }
}

/**
 * Decorative phone frame with a stylized social-grid inside. Inline
 * SVG; no asset round-trip. The slug is rendered as a "@handle" inside
 * the frame to give it personalized weight without requiring real data.
 */
function PhoneFrame({ slug }: { slug: string }) {
  return (
    <div
      aria-hidden="true"
      className="relative mx-auto w-full max-w-[260px] motion-safe:animate-[phone-float_3s_ease-in-out_infinite]"
      style={{ transform: 'rotate(-6deg)' }}
    >
      <svg
        viewBox="0 0 220 440"
        className="h-auto w-full"
        role="img"
        aria-label=""
      >
        <rect x="6" y="6" width="208" height="428" rx="32" fill="#1A1A1A" stroke="#2A2A2A" strokeWidth="2" />
        <rect x="14" y="14" width="192" height="412" rx="26" fill="#0E0E0E" />
        <rect x="80" y="22" width="60" height="14" rx="7" fill="#2A2A2A" />
        <text x="22" y="64" fontFamily="ui-monospace, monospace" fontSize="9" fill="#FFFFFF" letterSpacing="1">
          @{slug}
        </text>
        <rect x="22" y="74" width="42" height="42" rx="21" fill="#FF5500" />
        <rect x="74" y="80" width="44" height="6" rx="3" fill="#FFFFFF" />
        <rect x="74" y="92" width="32" height="5" rx="2.5" fill="#FFFFFF" opacity="0.5" />
        <g>
          {[0, 1, 2].map((row) =>
            [0, 1, 2].map((col) => (
              <rect
                key={`${row}-${col}`}
                x={22 + col * 56}
                y={130 + row * 68}
                width={50}
                height={62}
                fill={(row + col) % 2 === 0 ? '#252525' : '#1F1F1F'}
              />
            )),
          )}
        </g>
        <rect x="22" y="340" width="50" height="50" fill="#FF5500" />
        <rect x="78" y="340" width="50" height="50" fill="#252525" />
        <rect x="134" y="340" width="50" height="50" fill="#1F1F1F" />
      </svg>
    </div>
  );
}
