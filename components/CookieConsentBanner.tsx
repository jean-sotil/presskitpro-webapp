'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import {
  CONSENT_COOKIE_NAME,
  hasConsent,
  serializeConsentCookie,
} from '@/lib/consent/cookie-consent';
import { copy } from '@/lib/marketing/copy';

/**
 * Cookie consent banner (task-27 PR-2).
 *
 * Renders only when the visitor lacks the `cookie_consent=v1` cookie.
 * Per PRD §15 we only ever set the locale + auth cookies on visitors;
 * the banner is informational, not a "Reject all" toggle, because we
 * have no third-party trackers to opt out of. Acknowledging stores
 * the consent cookie for one year.
 */
export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Initial render only — `document.cookie` isn't available during
    // SSR. We rely on the post-mount check to avoid rendering the
    // banner for users who already acknowledged it.
    if (!hasConsent(document.cookie)) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  function accept() {
    document.cookie = serializeConsentCookie();
    setVisible(false);
  }

  return (
    <div
      role="region"
      aria-label="Aviso de cookies"
      data-testid={CONSENT_COOKIE_NAME}
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-3xl border border-border bg-surface p-4 shadow-lg md:bottom-6 md:p-5"
    >
      <div className="flex flex-col gap-3 text-sm md:flex-row md:items-center md:justify-between">
        <p className="text-text-muted">
          {copy.consent.body}{' '}
          <Link
            href={copy.consent.learnMoreHref}
            className="underline hover:text-text"
          >
            {copy.consent.learnMore}
          </Link>
          .
        </p>
        <button
          type="button"
          onClick={accept}
          className="self-start border border-accent bg-accent px-4 py-2 text-sm font-medium uppercase tracking-wider text-accent-contrast md:self-auto"
        >
          {copy.consent.cta}
        </button>
      </div>
    </div>
  );
}
