import { notFound, redirect } from 'next/navigation';
import { headers } from 'next/headers';

import { resolvePayloadUserLive } from '@/lib/auth/payload-user-from-request';
import { liveBundleDeps } from '@/lib/editor/bundle-live';
import { loadBundle } from '@/lib/editor/bundle';

import { ActiveProfileTracker } from './ActiveProfileTracker';
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

  return (
    <main id="main">
      {/* Task-31 PR-B — record this profile as the user's active one
          so the dashboard switcher resumes here on the next visit.
          Cookie write happens via a server action invoked on mount;
          calling it from the RSC during render would trip Next.js's
          "cookies can only be modified in a Server Action or Route
          Handler" guard. */}
      <ActiveProfileTracker profileId={profileId} />
      <EditorClient initialBundle={bundle} />
    </main>
  );
}
