import { notFound, redirect } from 'next/navigation';
import { headers } from 'next/headers';

import { resolvePayloadUserLive } from '@/lib/auth/payload-user-from-request';
import { liveBundleDeps } from '@/lib/editor/bundle-live';
import { loadBundle } from '@/lib/editor/bundle';

import { EditorClient } from './EditorClient';

export const dynamic = 'force-dynamic';

export default async function EditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profileId = Number.parseInt(id, 10);
  if (!Number.isInteger(profileId) || profileId <= 0) notFound();

  const user = await resolvePayloadUserLive(await headers());
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/dashboard/profile/${id}`)}`);
  }

  const bundle = await loadBundle(liveBundleDeps(), { profileId, user });
  if (!bundle) notFound();

  return <EditorClient initialBundle={bundle} />;
}
