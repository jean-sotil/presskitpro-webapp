'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

import { resolvePayloadUserLive } from '@/lib/auth/payload-user-from-request';
import { assertOwnsProfile, upsertProfileChild } from '@/lib/editor/upsert-child';
import { buildApplyPresetPatch } from '@/lib/presets/apply-preset';
import { getPresetById } from '@/lib/presets';

export type ApplyPresetResult =
  | { ok: true; presetId: string }
  | { ok: false; error: 'unauthorized' | 'not-found' | 'unknown-preset' | 'persist-failed' };

/**
 * Task-35 PR-C — apply a design preset to a profile.
 *
 * (a) writes `Themes.presetId`,
 * (b) overwrites color/font tokens with the preset's snapshot so the
 *     contrast gate (task-18) runs against the new palette,
 * (c) clears `contrastValidatedAt` so re-publish requires a fresh
 *     contrast pass — preventing a preset switch from sneaking past
 *     accessibility.
 *
 * Owner-only via `assertOwnsProfile`. Revalidates both the editor
 * route (so the right-pane PreviewPane re-renders against the new
 * tokens) and `/{slug}` so the public profile picks up the change on
 * the next request without waiting for the CDN's TTL.
 */
export async function applyPresetAction(
  profileId: number,
  presetId: string,
  slug: string,
): Promise<ApplyPresetResult> {
  if (!Number.isInteger(profileId) || profileId <= 0) {
    return { ok: false, error: 'not-found' };
  }
  const preset = getPresetById(presetId);
  if (!preset) return { ok: false, error: 'unknown-preset' };

  const user = await resolvePayloadUserLive(await headers());
  if (!user) return { ok: false, error: 'unauthorized' };
  if (!(await assertOwnsProfile({ profileId, user }))) {
    return { ok: false, error: 'not-found' };
  }

  const patch = buildApplyPresetPatch(preset);
  try {
    await upsertProfileChild({
      collection: 'themes',
      profileId,
      data: patch as unknown as Record<string, unknown>,
      user,
    });
  } catch {
    return { ok: false, error: 'persist-failed' };
  }
  revalidatePath(`/dashboard/profile/${profileId}`);
  if (slug) revalidatePath(`/${slug}`);
  return { ok: true, presetId: preset.id };
}
