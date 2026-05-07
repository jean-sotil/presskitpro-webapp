'use server';

import { cookies } from 'next/headers';

import { ACTIVE_PROFILE_COOKIE_NAME } from './active-profile';

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * Persists the most-recently opened profile id (task-31 PR-B).
 *
 * Called from the editor RSC on visit so the dashboard switcher can
 * highlight or auto-resume the same profile next session. The id is
 * a number/string from Payload — no PII concern; cookie is `Lax`
 * SameSite, root path, 1 year. No HttpOnly: server-only access via
 * Next's `cookies()` API; client never reads it.
 */
export async function setActiveProfileAction(
  profileId: number | string,
): Promise<void> {
  const id = String(profileId);
  if (!id) return;
  const store = await cookies();
  store.set(ACTIVE_PROFILE_COOKIE_NAME, id, {
    path: '/',
    maxAge: ONE_YEAR_SECONDS,
    sameSite: 'lax',
  });
}

export async function clearActiveProfileAction(): Promise<void> {
  const store = await cookies();
  store.set(ACTIVE_PROFILE_COOKIE_NAME, '', { path: '/', maxAge: 0 });
}
