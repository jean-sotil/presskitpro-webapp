'use client';

import { useTranslations } from 'next-intl';

import type { EditorBundle } from '@/lib/editor/bundle';
import type { Preset } from '@/lib/presets';

import { ContactEditorialNightlifeV1 } from './editorial-nightlife-v1/ContactRender.editorial-nightlife-v1';
import { ContactElectricFireTechno } from './electric-fire-techno/ContactRender.electric-fire-techno';
import { ContactFestivalClubOrange } from './festival-club-orange/ContactRender.festival-club-orange';
import { ContactMediakitProV1 } from './mediakit-pro-v1/ContactRender.mediakit-pro-v1';
import { ContactDeadSignal } from './dead-signal/ContactRender.dead-signal';
import { ContactBunker909 } from './bunker-909/ContactRender.bunker-909';
import { ContactForm } from './ContactForm';
import { TrackedContactCta } from './TrackedContactCta';

type ProfileWithContact = EditorBundle['profile'] & {
  contactWhatsapp?: string;
  contactEmail?: string;
  contactFormEnabled?: boolean;
};

export function ContactRender({
  bundle,
  preset,
}: {
  bundle: EditorBundle;
  preset?: Preset | null;
}) {
  const t = useTranslations('profile.contact');

  // Folder-owned preset dispatch.
  if (preset?.id === 'bunker-909') return <ContactBunker909 bundle={bundle} />;
  if (preset?.id === 'dead-signal') return <ContactDeadSignal bundle={bundle} />;
  if (preset?.id === 'electric-fire-techno') return <ContactElectricFireTechno bundle={bundle} />;
  if (preset?.id === 'mediakit-pro-v1') return <ContactMediakitProV1 bundle={bundle} />;
  if (preset?.id === 'festival-club-orange') return <ContactFestivalClubOrange bundle={bundle} />;
  if (preset?.id === 'editorial-nightlife-v1')
    return <ContactEditorialNightlifeV1 bundle={bundle} />;

  // No preset → unstyled inline-cta fallback for legacy profiles.
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
      className="border-b border-border px-6 py-16 md:px-12"
      data-scroll-animation="contact"
    >
      <h2 className="font-display text-2xl uppercase tracking-tight">{t('label')}</h2>
      {whatsapp || email ? (
        <ul className="mt-6 flex flex-wrap gap-3">
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
