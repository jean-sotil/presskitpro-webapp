/**
 * Active-profile cookie helpers (task-31 PR-B).
 *
 * Records the profile-id the user most-recently opened in the editor
 * so the dashboard switcher can highlight it on return. Per PRD §3
 * (Agent persona) — agencies own many profiles and shouldn't have to
 * pick from the list every visit.
 *
 * Pure module — `next/headers` work happens at the call site.
 */

export const ACTIVE_PROFILE_COOKIE_NAME = 'pkp_active_profile';
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function parseActiveProfileCookie(
  cookieHeader: string | null | undefined,
): string | null {
  if (!cookieHeader) return null;
  const prefix = `${ACTIVE_PROFILE_COOKIE_NAME}=`;
  for (const raw of cookieHeader.split(';')) {
    const part = raw.trim();
    if (part.startsWith(prefix)) {
      const value = part.slice(prefix.length).trim();
      return value.length > 0 ? value : null;
    }
  }
  return null;
}

export function serializeActiveProfileCookie(profileId: string): string {
  if (!profileId) {
    return [
      `${ACTIVE_PROFILE_COOKIE_NAME}=`,
      'Path=/',
      'Max-Age=0',
      'SameSite=Lax',
    ].join('; ');
  }
  return [
    `${ACTIVE_PROFILE_COOKIE_NAME}=${profileId}`,
    'Path=/',
    `Max-Age=${ONE_YEAR_SECONDS}`,
    'SameSite=Lax',
  ].join('; ');
}
