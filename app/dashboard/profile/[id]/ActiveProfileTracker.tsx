'use client';

import { useEffect } from 'react';

import { setActiveProfileAction } from '@/lib/dashboard/active-profile-actions';

/**
 * Tracks the most-recently opened profile by writing the
 * `pkp_active_profile` cookie via a server action on mount (task-31 PR-B,
 * fixed in task-33 follow-up).
 *
 * Why a client effect: Next.js only allows cookie writes from Server
 * Actions or Route Handlers. Calling the action from the RSC's render
 * pass — even though the action itself is `'use server'` — counts as
 * an RSC mutation and trips the guard. A client `useEffect` triggers
 * the action in a Server Action context and the cookie write succeeds.
 */
export function ActiveProfileTracker({
  profileId,
}: {
  profileId: number | string;
}) {
  useEffect(() => {
    void setActiveProfileAction(profileId);
  }, [profileId]);
  return null;
}
