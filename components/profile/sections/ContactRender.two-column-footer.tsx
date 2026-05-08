'use client';

import { useTranslations } from 'next-intl';

import type { EditorBundle } from '@/lib/editor/bundle';

import { ContactForm } from './ContactForm';
import { TrackedContactCta } from './TrackedContactCta';
import { TrackedSocialLink } from './TrackedSocialLink';

type ProfileWithContact = EditorBundle['profile'] & {
  contactWhatsapp?: string;
  contactEmail?: string;
  contactFormEnabled?: boolean;
};

type LinkRow = {
  id: number | string;
  platform: string;
  url: string;
  displayOrder?: number;
};

/**
 * Festival Club Orange contact — two-column footer band on hard black.
 *
 * Left: large `SOCIAL MEDIA` heading + a row of outlined-circle social
 * icons (3.5rem). Mirrors the spec's footer layout.
 *
 * Right: large accent-colored `CONTACTS` heading + WhatsApp + email
 * stacked below with circle icons. The `CONTACTS` label in orange is
 * the strongest accent moment of the page — final visual beat before
 * the marketing footer.
 */
export function ContactTwoColumnFooter({ bundle }: { bundle: EditorBundle }) {
  const t = useTranslations('profile.contact');
  const profile = bundle.profile as ProfileWithContact;
  const whatsapp = profile.contactWhatsapp?.trim() ?? '';
  const email = profile.contactEmail?.trim() ?? '';
  const formEnabled = Boolean(profile.contactFormEnabled);
  const profileId = Number(profile.id);
  const profileSlug = profile.slug;

  const socialLinks = ((bundle.socialLinks ?? []) as unknown as LinkRow[])
    .slice()
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  if (!whatsapp && !email && !formEnabled && socialLinks.length === 0) {
    return null;
  }

  return (
    <section
      id="contato"
      className="border-b border-border bg-bg px-6 py-20 md:px-12 md:py-28"
    >
      <div className="grid gap-14 md:grid-cols-2 md:gap-16">
        <div>
          <h2
            className="font-display uppercase leading-none tracking-[-0.01em] text-text"
            style={{ fontSize: 'clamp(2rem, 5vw, 4rem)' }}
          >
            Social media
          </h2>
          {socialLinks.length > 0 ? (
            <ul className="mt-8 flex flex-wrap items-center gap-4">
              {socialLinks.slice(0, 6).map((link) => (
                <li key={String(link.id)}>
                  <TrackedSocialLink
                    href={hrefFor(link)}
                    platform={link.platform}
                    profileSlug={profileSlug}
                    target={
                      link.platform !== 'email' && link.platform !== 'whatsapp'
                        ? '_blank'
                        : undefined
                    }
                    rel={
                      link.platform !== 'email' && link.platform !== 'whatsapp'
                        ? 'noopener noreferrer'
                        : undefined
                    }
                    className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-border text-text transition-[transform,colors] duration-quick hover:-translate-y-1 hover:border-accent hover:text-accent"
                  >
                    <PlatformIconCircle platform={link.platform} />
                  </TrackedSocialLink>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-8 text-sm text-text-muted">{t('label')}</p>
          )}
        </div>
        <div>
          <h2
            className="font-display uppercase leading-none tracking-[-0.01em] text-accent"
            style={{ fontSize: 'clamp(2rem, 5vw, 4rem)' }}
          >
            Contacts
          </h2>
          <ul className="mt-8 flex flex-col gap-4">
            {whatsapp ? (
              <li>
                <TrackedContactCta
                  href={whatsappHref(whatsapp)}
                  channel="whatsapp"
                  profileSlug={profileSlug}
                  className="group inline-flex items-center gap-3 text-sm font-semibold text-text transition-colors duration-quick hover:text-accent"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border border-border text-text transition-colors duration-quick group-hover:border-accent group-hover:text-accent">
                    <WhatsAppGlyph />
                  </span>
                  <span className="font-mono tracking-wide">
                    {formatWhatsapp(whatsapp)}
                  </span>
                </TrackedContactCta>
              </li>
            ) : null}
            {email ? (
              <li>
                <TrackedContactCta
                  href={emailHref(email)}
                  channel="email"
                  profileSlug={profileSlug}
                  className="group inline-flex items-center gap-3 text-sm font-semibold text-text transition-colors duration-quick hover:text-accent"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border border-border text-text transition-colors duration-quick group-hover:border-accent group-hover:text-accent">
                    <EmailGlyph />
                  </span>
                  <span className="font-mono tracking-wide">{email}</span>
                </TrackedContactCta>
              </li>
            ) : null}
          </ul>
          {formEnabled && profileId > 0 ? (
            <div className="mt-10 max-w-md">
              <ContactForm profileId={profileId} />
            </div>
          ) : null}
        </div>
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

function whatsappHref(value: string): string {
  if (value.startsWith('http')) return value;
  const digits = value.replace(/\D/g, '');
  return `https://wa.me/${digits}`;
}

function emailHref(value: string): string {
  return value.startsWith('mailto:') ? value : `mailto:${value}`;
}

function formatWhatsapp(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits ? `+${digits}` : value;
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

function PlatformIconCircle({ platform }: { platform: string }) {
  switch (platform) {
    case 'instagram':
      return (
        <svg {...ICON_PROPS}>
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'spotify':
      return (
        <svg {...ICON_PROPS}>
          <circle cx="12" cy="12" r="9" />
          <path d="M7 9.5c3-1 7-1 10 0.5M7.5 13c2.5-0.7 5.5-0.5 8 0.7M8 16c2-0.5 4-0.4 6 0.4" />
        </svg>
      );
    case 'soundcloud':
      return (
        <svg {...ICON_PROPS}>
          <path d="M3 14v4M6 12v6M9 10v8M12 8v10M15 10v8c2 0 4-1 4-4s-2-4-4-4" />
        </svg>
      );
    case 'youtube':
      return (
        <svg {...ICON_PROPS}>
          <rect x="2" y="5" width="20" height="14" rx="3" />
          <path d="M10 9l5 3-5 3z" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'tiktok':
      return (
        <svg {...ICON_PROPS}>
          <path d="M14 4v10a4 4 0 1 1-4-4" />
          <path d="M14 4c1 2 3 3 5 3" />
        </svg>
      );
    case 'whatsapp':
      return <WhatsAppGlyph />;
    case 'email':
      return <EmailGlyph />;
    default:
      return (
        <svg {...ICON_PROPS}>
          <path d="M10 14a3 3 0 0 0 4 0l3-3a3 3 0 0 0-4-4l-1 1" />
          <path d="M14 10a3 3 0 0 0-4 0l-3 3a3 3 0 0 0 4 4l1-1" />
        </svg>
      );
  }
}

function WhatsAppGlyph() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M21 12a9 9 0 0 1-13.5 7.8L3 21l1.3-4.4A9 9 0 1 1 21 12z" />
      <path d="M8.5 9c0 4 3 6.5 6.5 6.5l1.5-1.5-2-1.5-1 1c-1-0.5-2-1.5-2.5-2.5l1-1-1.5-2L9 8z" />
    </svg>
  );
}

function EmailGlyph() {
  return (
    <svg {...ICON_PROPS}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}
