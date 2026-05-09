'use client';

import { useTranslations } from 'next-intl';

import type { EditorBundle } from '@/lib/editor/bundle';

import { ContactForm } from './ContactForm';
import { TrackedContactCta } from './TrackedContactCta';

type ProfileWithContact = EditorBundle['profile'] & {
  contactWhatsapp?: string;
  contactEmail?: string;
  contactFormEnabled?: boolean;
};

/**
 * Electric Fire Techno contact footer — centered, stacked layout with
 * a fire-orange top edge gradient and a lightning-bolt divider. Per
 * docs/presets/MediakitPRO_template_3.json `footer`.
 *
 * Hierarchy: numbered "05 — CONTACT" mono marker, oversized gradient
 * "FOR BOOKING CONTACT" headline, profile email displayed centered
 * (per spec `footer.titleContent` + `footer.emailStyle`), then a row
 * of icon CTAs (whatsapp + email) and the optional contact form.
 *
 * The fire top-edge effect is layered as an absolute pseudo to sit
 * above the section bg but below content (z-0 vs z-10).
 */
export function ContactFireFooter({ bundle }: { bundle: EditorBundle }) {
  const t = useTranslations('profile.contact');
  const profile = bundle.profile as ProfileWithContact;
  const whatsapp = profile.contactWhatsapp?.trim() ?? '';
  const email = profile.contactEmail?.trim() ?? '';
  const formEnabled = Boolean(profile.contactFormEnabled);
  const profileId = Number(profile.id);
  const profileSlug = profile.slug;

  if (!whatsapp && !email && !formEnabled) return null;

  return (
    <section
      id="contato"
      data-fire-footer
      className="relative isolate overflow-hidden border-b border-border bg-bg px-6 py-20 md:px-12 md:py-28"
    >
      {/* Fire top edge gradient — absolute pseudo so it doesn't push
          the centered content. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[linear-gradient(to_bottom,rgba(255,69,0,0.45),rgba(255,140,0,0.18)_45%,transparent_90%)]"
      />
      <div className="relative z-10 mx-auto max-w-xl text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-text-muted">
          05 — {t('label')}
        </p>
        <h2
          data-fire-section-title
          className="mt-6 font-display uppercase leading-none tracking-tight"
          style={{ fontSize: 'clamp(1.75rem, 5vw, 3.5rem)' }}
        >
          {t('label')}
        </h2>
        {email ? (
          <p className="mt-6 break-words font-display text-base font-bold tracking-[0.04em] text-text md:text-xl">
            {email}
          </p>
        ) : null}
        {whatsapp || email ? (
          <ul className="mt-10 flex items-center justify-center gap-6">
            {whatsapp ? (
              <li>
                <TrackedContactCta
                  href={whatsappHref(whatsapp)}
                  channel="whatsapp"
                  profileSlug={profileSlug}
                  className="group inline-flex h-12 w-12 items-center justify-center text-text transition-all duration-quick hover:text-accent"
                  aria-label={t('whatsappCta')}
                >
                  <WhatsappIcon className="h-7 w-7 transition-transform duration-quick group-hover:-translate-y-0.5" />
                </TrackedContactCta>
              </li>
            ) : null}
            {email ? (
              <li>
                <TrackedContactCta
                  href={emailHref(email)}
                  channel="email"
                  profileSlug={profileSlug}
                  className="group inline-flex h-12 w-12 items-center justify-center text-text transition-all duration-quick hover:text-accent"
                  aria-label={t('emailCta')}
                >
                  <EmailIcon className="h-7 w-7 transition-transform duration-quick group-hover:-translate-y-0.5" />
                </TrackedContactCta>
              </li>
            ) : null}
          </ul>
        ) : null}
        <LightningDivider className="mx-auto mt-10 h-6 w-6" />
        {formEnabled && profileId > 0 ? (
          <div className="mx-auto mt-10 max-w-xl text-left">
            <ContactForm profileId={profileId} />
          </div>
        ) : null}
      </div>
    </section>
  );
}

function WhatsappIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M21 12a9 9 0 0 1-13.5 7.8L3 21l1.3-4.4A9 9 0 1 1 21 12z" />
      <path d="M8.5 9c0 4 3 6.5 6.5 6.5l1.5-1.5-2-1.5-1 1c-1-0.5-2-1.5-2.5-2.5l1-1-1.5-2L9 8z" />
    </svg>
  );
}

function EmailIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}

function LightningDivider({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
      style={{
        color: '#FF4500',
        filter: 'drop-shadow(0 0 8px rgba(255, 69, 0, 0.7))',
      }}
    >
      <path d="M14 2L4 14h6l-2 8 10-12h-6l2-8z" />
    </svg>
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
