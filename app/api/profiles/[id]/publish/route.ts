import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

import { resolvePayloadUserLive } from '@/lib/auth/payload-user-from-request';
import { liveBundleDeps } from '@/lib/editor/bundle-live';
import { publishProfile } from '@/lib/editor/bundle';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const profileId = Number.parseInt(id, 10);
  if (!Number.isInteger(profileId) || profileId <= 0) {
    return NextResponse.json({ error: 'invalid id' }, { status: 400 });
  }

  const user = await resolvePayloadUserLive(await headers());
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const result = await publishProfile(liveBundleDeps(), { profileId, user });
  if (!result.ok) {
    if (result.refusal.kind === 'contrast-stale') {
      return NextResponse.json(
        {
          error: 'contrast-stale',
          message:
            'O tema precisa ser revalidado (contraste WCAG) antes de publicar.',
          validatedAt: result.refusal.validatedAt,
        },
        { status: 422 },
      );
    }
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  // Note: ISR revalidate is fired by the Profiles afterChange hook (task-08).
  return NextResponse.json({
    profile: result.profile,
    publicPath: result.publicPath,
  });
}
