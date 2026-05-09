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
 * Dead Signal contact section template
 *
 * Layout: Harsh borders, dark panel with glitch/cyber hover states for CTAs.
 */
export function ContactDeadSignal({ bundle }: { bundle: EditorBundle }) {
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
      className="relative border-t border-white/10 bg-black/80 px-6 py-20 font-mono text-gray-300 backdrop-blur-md md:px-12 md:py-32"
    >
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 inline-flex items-center gap-3">
          <span className="h-px w-8 bg-red-500/80" />
          <p className="text-[10px] uppercase tracking-[0.25em] text-red-500/80">
            05 // {t('label')}
          </p>
        </div>

        <h2
          className="relative font-display uppercase leading-none tracking-tight text-white drop-shadow-[2px_2px_0px_rgba(239,68,68,0.8)]"
          style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
        >
          {t('label')}
          <span
            className="absolute -left-[2px] top-[1px] -z-10 text-cyan-400 opacity-60"
            aria-hidden="true"
          >
            {t('label')}
          </span>
        </h2>

        {whatsapp || email ? (
          <ul className="mt-12 flex flex-wrap gap-4">
            {whatsapp ? (
              <li>
                <TrackedContactCta
                  href={whatsappHref(whatsapp)}
                  channel="whatsapp"
                  profileSlug={profileSlug}
                  className="group relative inline-flex h-12 items-center overflow-hidden border border-red-500/50 bg-red-500/10 px-8 text-xs uppercase tracking-widest text-red-400 transition-all hover:border-red-500 hover:bg-red-500/20 hover:text-white hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                >
                  <span className="relative z-10">{t('whatsappCta')}</span>
                  <div className="absolute left-0 top-0 h-1 w-1 border-l border-t border-red-500" />
                  <div className="absolute bottom-0 right-0 h-1 w-1 border-b border-r border-red-500" />
                </TrackedContactCta>
              </li>
            ) : null}
            {email ? (
              <li>
                <TrackedContactCta
                  href={emailHref(email)}
                  channel="email"
                  profileSlug={profileSlug}
                  className="group relative inline-flex h-12 items-center overflow-hidden border border-white/20 bg-black/50 px-8 text-xs uppercase tracking-widest text-gray-300 transition-all hover:border-white/50 hover:bg-white/5 hover:text-white"
                >
                  <span className="relative z-10">{t('emailCta')}</span>
                  <div className="absolute left-0 top-0 h-1 w-1 border-l border-t border-white/50" />
                  <div className="absolute bottom-0 right-0 h-1 w-1 border-b border-r border-white/50" />
                </TrackedContactCta>
              </li>
            ) : null}
          </ul>
        ) : null}

        {formEnabled && profileId > 0 ? (
          <div className="relative mt-12 max-w-xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
            <div className="absolute left-0 top-0 h-2 w-2 border-l border-t border-white/30" />
            <div className="absolute right-0 top-0 h-2 w-2 border-r border-t border-white/30" />
            <div className="absolute bottom-0 left-0 h-2 w-2 border-b border-l border-white/30" />
            <div className="absolute bottom-0 right-0 h-2 w-2 border-b border-r border-white/30" />
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
