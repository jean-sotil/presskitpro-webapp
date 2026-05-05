import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

import { resolvePayloadUserLive } from '@/lib/auth/payload-user-from-request';
import { assertOwnsProfile, upsertProfileChild } from '@/lib/editor/upsert-child';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PATCHABLE = new Set([
  'colorPresetId',
  'bg',
  'accent',
  'text',
  'fontPairId',
  'heroStyle',
  'galleryLayout',
  'sectionOrder',
  'contrastValidatedAt',
]);

export async function PATCH(
  req: Request,
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

  if (!(await assertOwnsProfile({ profileId, user }))) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  for (const key of Object.keys(body)) {
    if (PATCHABLE.has(key)) data[key] = body[key];
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'no patchable fields' }, { status: 400 });
  }

  try {
    const updated = await upsertProfileChild({
      collection: 'themes',
      profileId,
      data,
      user,
    });
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'update failed' },
      { status: 400 },
    );
  }
}
