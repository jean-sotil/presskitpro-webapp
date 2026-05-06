import type { EditorBundle } from '@/lib/editor/bundle';

import { ContactForm } from './ContactForm';
import { TrackedContactCta } from './TrackedContactCta';

type ProfileWithContact = EditorBundle['profile'] & {
  contactWhatsapp?: string;
  contactEmail?: string;
  contactFormEnabled?: boolean;
};

export function ContactRender({ bundle }: { bundle: EditorBundle }) {
  const profile = bundle.profile as ProfileWithContact;
  const whatsapp = profile.contactWhatsapp?.trim() ?? '';
  const email = profile.contactEmail?.trim() ?? '';
  const formEnabled = Boolean(profile.contactFormEnabled);
  const profileId = Number(profile.id);
  const profileSlug = profile.slug;

  if (!whatsapp && !email && !formEnabled) return null;

  return (
    <section id="contato" className="border-b border-border px-6 py-16 md:px-12">
      <h2 className="font-display text-2xl uppercase tracking-tight">Contato</h2>
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
                Chamar no WhatsApp
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
                Enviar e-mail
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
