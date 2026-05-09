'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

import type { EditorBundle } from '@/lib/editor/bundle';
import { parseAndCanonicalize } from '@/lib/editor/social-link-validate';
import type { MutationScope } from '@/app/dashboard/profile/[id]/EditorClient';

export interface ContactEditCardProps {
  bundle: EditorBundle;
  onMutate: (scope: MutationScope, patch: Record<string, unknown>) => void;
}

type ProfileWithContact = EditorBundle['profile'] & {
  contactWhatsapp?: string;
  contactEmail?: string;
  contactFormEnabled?: boolean;
  contactFormDestination?: string;
};

export function ContactEditCard({ bundle, onMutate }: ContactEditCardProps) {
  const t = useTranslations('editor.cards.contact');
  const tCommon = useTranslations('editor.common');
  const profile = bundle.profile as ProfileWithContact;
  const [whatsapp, setWhatsapp] = useState(profile.contactWhatsapp ?? '');
  const [email, setEmail] = useState(profile.contactEmail ?? '');
  const [destination, setDestination] = useState(
    profile.contactFormDestination ?? '',
  );

  // Bundle can be replaced by a refetch (e.g. autosave error invalidate).
  // Re-sync local state when the source value changes from the outside.
  useEffect(() => {
    setWhatsapp(profile.contactWhatsapp ?? '');
  }, [profile.contactWhatsapp]);
  useEffect(() => {
    setEmail(profile.contactEmail ?? '');
  }, [profile.contactEmail]);
  useEffect(() => {
    setDestination(profile.contactFormDestination ?? '');
  }, [profile.contactFormDestination]);

  const whatsappValidation =
    whatsapp.trim().length === 0
      ? { ok: true as const }
      : parseAndCanonicalize('whatsapp', whatsapp);
  const emailValidation =
    email.trim().length === 0
      ? { ok: true as const }
      : parseAndCanonicalize('email', email);

  function commitWhatsapp() {
    if (whatsapp.trim().length === 0) {
      onMutate('profile', { contactWhatsapp: '' });
      return;
    }
    const r = parseAndCanonicalize('whatsapp', whatsapp);
    if (r.ok) {
      setWhatsapp(r.canonical);
      onMutate('profile', { contactWhatsapp: r.canonical });
    }
  }

  function commitEmail() {
    if (email.trim().length === 0) {
      onMutate('profile', { contactEmail: '' });
      return;
    }
    const r = parseAndCanonicalize('email', email);
    if (r.ok) {
      // Strip the `mailto:` for the editor input — keep that detail
      // server-side. The render layer adds `mailto:` back when rendering.
      const visible = r.canonical.replace(/^mailto:/, '');
      setEmail(visible);
      onMutate('profile', { contactEmail: visible });
    }
  }

  function commitDestination() {
    if (destination.trim().length === 0) {
      onMutate('profile', { contactFormDestination: '' });
      return;
    }
    const r = parseAndCanonicalize('email', destination);
    if (r.ok) {
      const visible = r.canonical.replace(/^mailto:/, '');
      setDestination(visible);
      onMutate('profile', { contactFormDestination: visible });
    }
  }

  function toggleForm(value: boolean) {
    onMutate('profile', { contactFormEnabled: value });
  }

  return (
    <div className="flex flex-col gap-6 border border-border bg-surface p-6">
      <header>
        <p className="font-display text-xs uppercase tracking-widest text-text-muted">
          {tCommon('editingPrefix')} {t('label')}
        </p>
        <h2 className="mt-2 font-display text-2xl uppercase tracking-tight">
          {t('heading')}
        </h2>
      </header>

      <label className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-wider text-text-muted">
          {t('whatsappLabel')}
        </span>
        <input
          type="text"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          onBlur={commitWhatsapp}
          placeholder={t('whatsappPlaceholder')}
          aria-invalid={!whatsappValidation.ok}
          aria-label={t('whatsappLabel')}
          className="h-9 border border-border bg-bg px-3 text-sm outline-none focus:border-accent"
        />
        {!whatsappValidation.ok ? (
          <span role="alert" className="text-xs text-text-muted">
            {t('whatsappError')}
          </span>
        ) : (
          <span className="text-xs text-text-muted">
            {t('whatsappHint')}
          </span>
        )}
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-wider text-text-muted">
          {t('emailLabel')}
        </span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={commitEmail}
          placeholder={t('emailPlaceholder')}
          aria-invalid={!emailValidation.ok}
          aria-label={t('emailLabel')}
          className="h-9 border border-border bg-bg px-3 text-sm outline-none focus:border-accent"
        />
        {!emailValidation.ok ? (
          <span role="alert" className="text-xs text-text-muted">
            {t('emailError')}
          </span>
        ) : null}
      </label>

      <fieldset className="flex flex-col gap-3 border border-border p-4">
        <legend className="px-2 text-xs uppercase tracking-wider text-text-muted">
          {t('formLegend')}
        </legend>
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={Boolean(profile.contactFormEnabled)}
            onChange={(e) => toggleForm(e.target.checked)}
            aria-label={t('formToggleAriaLabel')}
            className="h-4 w-4"
          />
          {t('formToggle')}
        </label>
        {profile.contactFormEnabled ? (
          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wider text-text-muted">
              {t('destinationLabel')}
            </span>
            <input
              type="email"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              onBlur={commitDestination}
              placeholder={
                profile.contactEmail
                  ? t('destinationPlaceholderWithDefault', { email: profile.contactEmail })
                  : t('emailPlaceholder')
              }
              aria-label={t('destinationLabel')}
              className="h-9 border border-border bg-bg px-3 text-sm outline-none focus:border-accent"
            />
            <span className="text-xs text-text-muted">
              {t('destinationHint')}
            </span>
          </label>
        ) : null}
      </fieldset>
    </div>
  );
}
