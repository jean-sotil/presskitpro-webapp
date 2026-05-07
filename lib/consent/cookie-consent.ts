/**
 * Cookie consent state — the single non-essential cookie we set.
 *
 * PRD §15: PressKit.pro only ever stores the locale + auth cookies on
 * visitors (no analytics or tracking cookies). The consent banner
 * itself records its acknowledgment in `cookie_consent=v1` so we don't
 * keep showing it. That cookie is technically a third minor cookie,
 * but it carries no PII and self-expires in a year.
 */

export const CONSENT_COOKIE_NAME = 'cookie_consent';
export const CONSENT_COOKIE_VALUE = 'v1';
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function hasConsent(cookieHeader: string | null | undefined): boolean {
  if (!cookieHeader) return false;
  return cookieHeader
    .split(';')
    .map((p) => p.trim())
    .some((p) => p === `${CONSENT_COOKIE_NAME}=${CONSENT_COOKIE_VALUE}`);
}

export function serializeConsentCookie(): string {
  return [
    `${CONSENT_COOKIE_NAME}=${CONSENT_COOKIE_VALUE}`,
    'Path=/',
    `Max-Age=${ONE_YEAR_SECONDS}`,
    'SameSite=Lax',
  ].join('; ');
}
