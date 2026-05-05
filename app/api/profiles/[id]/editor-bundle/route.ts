import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

import { resolvePayloadUserLive } from '@/lib/auth/payload-user-from-request';
import { liveBundleDeps } from '@/lib/editor/bundle-live';
import { loadBundle } from '@/lib/editor/bundle';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const profileId = parseProfileId(id);
  if (profileId === null) {
    return NextResponse.json({ error: 'invalid id' }, { status: 400 });
  }

  const user = await resolvePayloadUserLive(await headers());
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const bundle = await loadBundle(liveBundleDeps(), { profileId, user });
  if (!bundle) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  return NextResponse.json(bundle);
}

function parseProfileId(value: string): number | null {
  const n = Number.parseInt(value, 10);
  return Number.isInteger(n) && n > 0 ? n : null;
}
