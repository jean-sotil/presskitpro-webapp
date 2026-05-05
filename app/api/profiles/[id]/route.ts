import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

import { resolvePayloadUserLive } from '@/lib/auth/payload-user-from-request';
import { payload as getPayloadInstance } from '@/lib/payload';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PATCHABLE_FIELDS = new Set([
  'slug',
  'pressKitUrl',
  'defaultLocale',
  'localesAvailable',
  'portrait',
  'logo',
]);

export async function PATCH(
  req: Request,
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

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  // Whitelist the user-mutable fields. status is gated through the publish
  // routes; press-kit-{provider,health,lastCheckedAt} are derived/cron-owned.
  const data: Record<string, unknown> = {};
  for (const key of Object.keys(body)) {
    if (PATCHABLE_FIELDS.has(key)) data[key] = body[key];
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'no patchable fields' }, { status: 400 });
  }

  try {
    const p = await getPayloadInstance();
    const updated = await p.update({
      collection: 'profiles',
      id: profileId,
      data,
      req: { user } as never,
    });
    return NextResponse.json(updated);
  } catch (err) {
    // Payload throws on access denial + validation failures. Coerce both
    // into 400-or-404 so the editor can surface a friendly retry message.
    if (err instanceof Error && /access|forbidden|not found/i.test(err.message)) {
      return NextResponse.json({ error: 'forbidden' }, { status: 404 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'update failed' },
      { status: 400 },
    );
  }
}

function parseProfileId(value: string): number | null {
  const n = Number.parseInt(value, 10);
  return Number.isInteger(n) && n > 0 ? n : null;
}
