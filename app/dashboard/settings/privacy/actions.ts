'use server';

import { redirect } from 'next/navigation';

import { decideSoftDelete } from '@/lib/account/soft-delete';
import { payload } from '@/lib/payload';
import { supabaseServer } from '@/lib/supabase/server';

export type DeleteAccountState = {
  ok: boolean;
  reason?: 'user-not-found' | 'email-mismatch' | 'unauthenticated';
};

/**
 * Soft-delete the caller's account (task-33 PR-A).
 *
 *   1. Verifies the typed-email matches the authenticated user's email.
 *   2. Stamps `Users.deletionRequestedAt`.
 *   3. Cascades: every owned `Profile.status` flips to `unpublished`
 *      so the public route 404s immediately (the [slug] page also
 *      checks `owner.deletionRequestedAt` for defense-in-depth).
 *   4. Signs the user out of Supabase Auth.
 *   5. Redirects to `/?account_deleted=1` for the success banner.
 *
 * Idempotent: re-confirming on a soft-deleted account is a no-op
 * except for re-running the sign-out + redirect.
 */
export async function deleteAccountAction(
  _prev: DeleteAccountState,
  formData: FormData,
): Promise<DeleteAccountState> {
  const supabase = await supabaseServer();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();
  if (!supabaseUser) {
    return { ok: false, reason: 'unauthenticated' };
  }

  const confirmEmail = String(formData.get('confirmEmail') ?? '');
  const p = await payload();
  const userResult = await p.find({
    collection: 'users',
    where: { supabaseUserId: { equals: supabaseUser.id } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  const user = userResult.docs[0] as
    | { id: number | string; email?: string; deletionRequestedAt?: string | null }
    | undefined;
  if (!user) {
    return { ok: false, reason: 'user-not-found' };
  }

  const decision = decideSoftDelete({
    user: {
      id: user.id,
      email: user.email ?? null,
      deletionRequestedAt: user.deletionRequestedAt ?? null,
    },
    confirmEmail,
    now: new Date(),
  });
  if (!decision.ok) {
    return { ok: false, reason: decision.reason };
  }

  if (!decision.alreadyMarked) {
    await p.update({
      collection: 'users',
      id: user.id,
      data: decision.patch as { deletionRequestedAt?: string },
      overrideAccess: true,
    });
    // Cascade: unpublish every owned profile so the public CTA / page
    // disappears immediately. The hard-delete cron (PR-C) handles
    // permanent removal after the 14-day grace.
    const profiles = await p.find({
      collection: 'profiles',
      where: { owner: { equals: user.id } },
      limit: 100,
      depth: 0,
      overrideAccess: true,
    });
    for (const profile of profiles.docs) {
      const id = (profile as { id?: number | string }).id;
      if (id === undefined) continue;
      await p.update({
        collection: 'profiles',
        id,
        data: { status: 'unpublished' },
        overrideAccess: true,
      });
    }
  }

  await supabase.auth.signOut();
  redirect('/?account_deleted=1');
}

/**
 * Stub for the export action (PR-B wires the actual job).
 */
export async function requestExportAction(): Promise<{ ok: true; queued: boolean }> {
  return { ok: true, queued: false };
}
