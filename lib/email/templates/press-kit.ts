import 'server-only';

import { getTranslations } from 'next-intl/server';

import {
  fromPayloadLocale,
  type SupportedLocale,
} from '@/lib/i18n/locale';

/**
 * Renders the press-kit warning + broken email subject + body in the
 * profile-owner's preferred locale (task-30 + task-29).
 *
 * The Profile's `defaultLocale` is the proxy for "DJ's preferred
 * locale" — there is no per-User locale field today.
 */

export type PressKitEmailKind = 'warning' | 'broken';

export type RenderedEmail = {
  subject: string;
  body: string;
};

export async function renderPressKitEmail(args: {
  kind: PressKitEmailKind;
  url: string;
  payloadLocale: string;
}): Promise<RenderedEmail> {
  const locale: SupportedLocale = fromPayloadLocale(args.payloadLocale) ?? 'pt';
  const t = await getTranslations({
    locale,
    namespace:
      args.kind === 'warning' ? 'email.pressKitWarning' : 'email.pressKitBroken',
  });
  return {
    subject: t('subject'),
    body: t('body', { url: args.url }),
  };
}
