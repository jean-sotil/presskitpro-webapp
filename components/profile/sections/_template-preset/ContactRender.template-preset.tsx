'use client';

import { useTranslations } from 'next-intl';

import type { EditorBundle } from '@/lib/editor/bundle';

import { ContactForm } from '../ContactForm';
import { TrackedContactCta } from '../TrackedContactCta';

type ProfileWithContact = EditorBundle['profile'] & {
  contactWhatsapp?: string;
  contactEmail?: string;
  contactFormEnabled?: boolean;
};

/**
 * [PRESET-NAME] contact section template
 *
 * Replace this description with your preset's contact-section design
 * philosophy. Click-tracking is owned by `<TrackedContactCta>`. The
 * embedded form is owned by `<ContactForm>` (Turnstile, validation,
 * spam protection — do not reimplement).
 *
 * Key points to document:
 *   - Layout (inline CTAs, dark panel, two-column footer, etc.)
 *   - Whether the embedded form is shown inline or in a separate panel
 *   - Hover/focus states
 *   - Any CSS data attributes used for styling
 *
 * Code pattern:
 *   - Read whatsapp / email / formEnabled off `bundle.profile`
 *   - Return null when none of the three are set
 *   - Build CTAs only for the channels that have data
 *   - Mount `<ContactForm>` only when `formEnabled` is true AND
 *     `profileId` is a valid positive number
 */
export function Contact_TEMPLATE_PRESET({ bundle }: { bundle: EditorBundle }) {
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
      className="border-b border-border bg-bg px-6 py-20 md:px-12 md:py-32"
    >
      <div className="mx-auto max-w-3xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-text-muted">
          05 — {t('label')}
        </p>
        <h2
          className="mt-6 font-display uppercase leading-none tracking-tight text-text"
          style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
        >
          {t('label')}
        </h2>
        {whatsapp || email ? (
          <ul className="mt-12 flex flex-wrap gap-3">
            {whatsapp ? (
              <li>
                <TrackedContactCta
                  href={whatsappHref(whatsapp)}
                  channel="whatsapp"
                  profileSlug={profileSlug}
                  className="inline-flex h-12 items-center border border-accent bg-accent px-6 text-sm uppercase tracking-wider text-accent-contrast"
                >
                  {t('whatsappCta')}
                </TrackedContactCta>
              </li>
            ) : null}
            {email ? (
              <li>
                <TrackedContactCta
                  href={emailHref(email)}
                  channel="email"
                  profileSlug={profileSlug}
                  className="inline-flex h-12 items-center border border-border px-6 text-sm uppercase tracking-wider text-text"
                >
                  {t('emailCta')}
                </TrackedContactCta>
              </li>
            ) : null}
          </ul>
        ) : null}
        {formEnabled && profileId > 0 ? (
          <div className="mt-10 max-w-xl">
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
