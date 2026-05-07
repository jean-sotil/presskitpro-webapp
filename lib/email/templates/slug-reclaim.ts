import 'server-only';

import { getTranslations } from 'next-intl/server';

import {
  fromPayloadLocale,
  type SupportedLocale,
} from '@/lib/i18n/locale';

/**
 * Slug-reclaim email templates (task-32). Renders the Day-23 warning
 * and the Day-30 released emails in the profile owner's preferred
 * locale (proxied via `Profile.defaultLocale`).
 *
 * The warning email body interpolates `{slug}` + `{keepUrl}`; the
 * released email interpolates only `{slug}`.
 */

export type SlugReclaimEmailKind = 'warning' | 'released';

export type RenderedEmail = {
  subject: string;
  body: string;
};

export async function renderSlugReclaimEmail(args: {
  kind: SlugReclaimEmailKind;
  slug: string;
  keepUrl?: string;
  payloadLocale: string;
}): Promise<RenderedEmail> {
  const locale: SupportedLocale = fromPayloadLocale(args.payloadLocale) ?? 'pt';
  const namespace =
    args.kind === 'warning' ? 'email.slugReclaimWarning' : 'email.slugReclaimReleased';
  const t = await getTranslations({ locale, namespace });
  return {
    subject: t('subject', { slug: args.slug }),
    body: t('body', { slug: args.slug, keepUrl: args.keepUrl ?? '' }),
  };
}
