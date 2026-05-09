'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';

import type { EditorBundle } from '@/lib/editor/bundle';
import { mediaUrl } from '@/lib/media/url';

import { ContactForm } from '../ContactForm';
import { TrackedContactCta } from '../TrackedContactCta';

type ProfileWithContact = EditorBundle['profile'] & {
  contactWhatsapp?: string;
  contactEmail?: string;
  contactFormEnabled?: boolean;
};

type PortraitMedia = {
  bucket: string;
  path: string;
  alt?: string;
  width?: number | null;
  height?: number | null;
};

/**
 * Hard Techno Underground booking panel — split layout with the artist
 * portrait pinned to the left at high contrast and a right-aligned
 * column carrying the section marker, "FOR BOOKING CONTACT" headline,
 * channel rows, and a single retro-pointer CTA. On mobile, the photo
 * stacks above the text.
 */
export function ContactMediakitProV1({ bundle }: { bundle: EditorBundle }) {
  const t = useTranslations('profile');
  const profile = bundle.profile as ProfileWithContact;
  const whatsapp = profile.contactWhatsapp?.trim() ?? '';
  const email = profile.contactEmail?.trim() ?? '';
  const formEnabled = Boolean(profile.contactFormEnabled);
  const profileId = Number(profile.id);
  const profileSlug = profile.slug;

  if (!whatsapp && !email && !formEnabled) return null;

  const portraitMedia = profile.portrait as PortraitMedia | null | undefined;
  const portraitUrl = mediaUrl(portraitMedia ?? null);
  const portraitWidth = (portraitMedia?.width ?? 1200) || 1200;
  const portraitHeight = (portraitMedia?.height ?? 1600) || 1600;

  const primaryHref = whatsapp ? whatsappHref(whatsapp) : email ? emailHref(email) : null;
  const primaryChannel: 'whatsapp' | 'email' | null = whatsapp
    ? 'whatsapp'
    : email
      ? 'email'
      : null;

  return (
    <section
      id="contato"
      className="grid border-b border-border bg-bg md:grid-cols-[45%_1fr]"
    >
      {portraitUrl ? (
        <div className="relative aspect-[3/4] w-full md:aspect-auto md:h-full md:min-h-[640px]">
          <Image
            src={portraitUrl}
            alt={portraitMedia?.alt ?? ''}
            width={portraitWidth}
            height={portraitHeight}
            sizes="(min-width: 768px) 45vw, 100vw"
            className="h-full w-full object-cover"
            style={{ filter: 'contrast(1.15) saturate(0.1)' }}
          />
        </div>
      ) : (
        <div aria-hidden="true" className="aspect-[3/4] w-full bg-surface md:aspect-auto md:min-h-[640px]" />
      )}
      <div className="flex flex-col justify-center px-6 py-20 md:px-16 md:py-32">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
          {t('contact.label')}
        </p>
        <h2
          className="mt-6 whitespace-pre-line font-display uppercase leading-none tracking-tight text-text"
          style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}
        >
          {t('contact.heading')}
        </h2>
        <ul className="mt-12 flex flex-col gap-5">
          {whatsapp ? (
            <li className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-text-muted text-text">
                <WhatsAppGlyph />
              </span>
              <span className="font-mono text-sm text-text">{formatWhatsapp(whatsapp)}</span>
            </li>
          ) : null}
          {email ? (
            <li className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-text-muted text-text">
                <EmailGlyph />
              </span>
              <span className="font-mono text-sm text-text">{email}</span>
            </li>
          ) : null}
        </ul>
        {primaryHref && primaryChannel ? (
          <div className="mt-12 flex items-center gap-4">
            <RetroPointer className="h-10 w-10 -rotate-12 text-text" />
            <TrackedContactCta
              href={primaryHref}
              channel={primaryChannel}
              profileSlug={profileSlug}
              className="inline-flex h-12 items-center bg-accent px-10 text-xs font-bold uppercase tracking-[0.18em] text-accent-contrast transition-colors duration-quick hover:bg-text hover:text-bg"
            >
              {t('ctaUnderground')}
            </TrackedContactCta>
          </div>
        ) : null}
        {formEnabled && profileId > 0 ? (
          <div className="mt-12 max-w-xl">
            <ContactForm profileId={profileId} />
          </div>
        ) : null}
      </div>
    </section>
  );
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

function WhatsAppGlyph() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 0 1-13.5 7.8L3 21l1.3-4.4A9 9 0 1 1 21 12z" />
      <path d="M8.5 9c0 4 3 6.5 6.5 6.5l1.5-1.5-2-1.5-1 1c-1-0.5-2-1.5-2.5-2.5l1-1-1.5-2L9 8z" />
    </svg>
  );
}

function EmailGlyph() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}

function RetroPointer({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M32 8v28" />
      <path d="M22 36c0-3 4-6 10-6s10 3 10 6v18c0 3-3 4-6 4H28c-3 0-6-1-6-4V36z" fill="currentColor" stroke="none" opacity="0.95" />
      <path d="M28 40v14M32 40v14M36 40v14" stroke="#000" strokeWidth="1.5" />
      <path d="M14 40h6" />
      <path d="M44 40h6" />
    </svg>
  );
}
