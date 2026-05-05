import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

import { resolvePayloadUserLive } from '@/lib/auth/payload-user-from-request';
import { payload as getPayloadInstance } from '@/lib/payload';
import { assertOwnsProfile } from '@/lib/editor/upsert-child';
import { fetchSoundcloudOembed } from '@/lib/server/soundcloud-oembed';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * PUT — set / update / refresh the featured track for a profile.
 * Body: `{ url: string, force?: boolean }`. When the row already
 * exists and `fetchedAt` is recent (< 30 days) and `url` is unchanged,
 * we skip the network call and return the cached row. `force: true`
 * always re-fetches.
 *
 * DELETE — remove the featured track row.
 *
 * Auth: caller must own the profile (`assertOwnsProfile`).
 */

const STALE_AFTER_MS = 30 * 24 * 60 * 60 * 1000;

export async function PUT(
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

  let body: { url?: unknown; force?: unknown };
  try {
    body = (await req.json()) as { url?: unknown; force?: unknown };
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  if (typeof body.url !== 'string' || body.url.trim().length === 0) {
    return NextResponse.json({ error: 'url required' }, { status: 400 });
  }
  const force = body.force === true;

  const p = await getPayloadInstance();

  // Look up the existing row (may be missing).
  const existingResult = await p.find({
    collection: 'featured-tracks',
    where: { profile: { equals: profileId } },
    limit: 1,
    depth: 0,
    req: { user } as never,
  });
  const existing = existingResult.docs[0] as
    | {
        id: number;
        url?: string;
        oembedHtml?: string | null;
        fetchedAt?: string | null;
      }
    | undefined;

  // Cache hit: same URL + fresh + we have html + caller didn't force.
  const fresh =
    existing?.fetchedAt &&
    Date.now() - new Date(existing.fetchedAt).getTime() < STALE_AFTER_MS;
  if (
    !force &&
    existing &&
    existing.url === body.url &&
    existing.oembedHtml &&
    fresh
  ) {
    return NextResponse.json({ ok: true, track: existing, cached: true });
  }

  const oembed = await fetchSoundcloudOembed({ url: body.url });
  if (!oembed.ok) {
    return NextResponse.json(
      { error: 'oembed-failed', reason: oembed.reason, status: oembed.status },
      { status: oembed.reason === 'invalid-host' || oembed.reason === 'invalid-url' ? 400 : 502 },
    );
  }

  const data = {
    profile: profileId,
    provider: 'soundcloud' as const,
    url: body.url,
    oembedHtml: oembed.oembedHtml,
    fetchedAt: oembed.fetchedAt,
  };

  try {
    if (existing) {
      const updated = await p.update({
        collection: 'featured-tracks',
        id: existing.id,
        data,
        req: { user } as never,
      });
      return NextResponse.json({ ok: true, track: updated });
    }
    const created = await p.create({
      collection: 'featured-tracks',
      data,
      req: { user } as never,
    });
    return NextResponse.json({ ok: true, track: created });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'persist failed' },
      { status: 500 },
    );
  }
}

export async function DELETE(
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
  if (!(await assertOwnsProfile({ profileId, user }))) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  const p = await getPayloadInstance();
  const existing = await p.find({
    collection: 'featured-tracks',
    where: { profile: { equals: profileId } },
    limit: 1,
    depth: 0,
    req: { user } as never,
  });
  const row = existing.docs[0];
  if (row) {
    await p.delete({
      collection: 'featured-tracks',
      id: row.id,
      req: { user } as never,
    });
  }
  return NextResponse.json({ ok: true });
}
