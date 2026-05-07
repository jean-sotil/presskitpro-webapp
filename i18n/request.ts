import { cookies, headers } from 'next/headers';
import type { AbstractIntlMessages } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';

import {
  LOCALE_COOKIE_NAME,
  negotiateLocale,
  type SupportedLocale,
} from '@/lib/i18n/locale';

/**
 * next-intl request config (task-29 PR-A).
 *
 * Resolves the active locale per request: cookie wins → Accept-Language
 * matches → default `pt`. Loads the matching JSON catalog dynamically
 * so only the active locale's bytes ride the response.
 */
export default getRequestConfig(async () => {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  const locale = negotiateLocale({
    cookie: cookieStore.get(LOCALE_COOKIE_NAME)?.value,
    acceptLanguage: headerStore.get('accept-language'),
  });
  const messages = await loadMessages(locale);
  return { locale, messages };
});

async function loadMessages(locale: SupportedLocale): Promise<AbstractIntlMessages> {
  // Dynamic import keeps non-active locales out of the route's bundle.
  const mod = await import(`@/messages/${locale}.json`);
  return (mod.default ?? mod) as AbstractIntlMessages;
}
