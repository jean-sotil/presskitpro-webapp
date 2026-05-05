import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

import { resolvePayloadUserLive } from '@/lib/auth/payload-user-from-request';
import { payload as getPayloadInstance } from '@/lib/payload';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PATCHABLE = new Set(['alt', 'decorative']);

/** Confirms the user has a path to this Media doc — either as the
 *  `Media.owner` (covers portrait/logo on their own profile) OR as
 *  the gallery-list owner of any profile that references it. */
async function userOwnsMedia(args: {
  mediaId: number;
  userId: number | string;
}): Promise<boolean> {
  const p = await getPayloadInstance();
  // Direct ownership.
  const direct = await p.find({
    collection: 'media',
    where: {
      and: [{ id: { equals: args.mediaId } }, { owner: { equals: args.userId } }],
    },
    limit: 1,
    depth: 0,
  });
  if (direct.totalDocs > 0) return true;
  // Indirect: profile they own references this media in its gallery.
  const viaGallery = await p.find({
    collection: 'profiles',
    where: {
      and: [
        { owner: { equals: args.userId } },
        { gallery: { in: [args.mediaId] } },
      ],
    },
    limit: 1,
    depth: 0,
  });
  return viaGallery.totalDocs > 0;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const mediaId = Number.parseInt(id, 10);
  if (!Number.isInteger(mediaId) || mediaId <= 0) {
    return NextResponse.json({ error: 'invalid id' }, { status: 400 });
  }

  const user = await resolvePayloadUserLive(await headers());
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  if (!(await userOwnsMedia({ mediaId, userId: user.id }))) {
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

  // R5 mitigation: when flipping decorative=true, blank the alt server-side
  // so stale alt copy doesn't leak into the public render.
  if (data.decorative === true) {
    data.alt = '';
  }

  try {
    const p = await getPayloadInstance();
    const updated = await p.update({
      collection: 'media',
      id: mediaId,
      data,
      req: { user } as never,
    });
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'update failed' },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const mediaId = Number.parseInt(id, 10);
  if (!Number.isInteger(mediaId) || mediaId <= 0) {
    return NextResponse.json({ error: 'invalid id' }, { status: 400 });
  }

  const user = await resolvePayloadUserLive(await headers());
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  if (!(await userOwnsMedia({ mediaId, userId: user.id }))) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  const p = await getPayloadInstance();
  // Read the doc first so we know the bucket/path for storage cleanup.
  let doc: { bucket?: string; path?: string };
  try {
    doc = (await p.findByID({
      collection: 'media',
      id: mediaId,
      depth: 0,
      req: { user } as never,
    })) as { bucket?: string; path?: string };
  } catch {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  // R3 mitigation: delete the Storage object FIRST. If that fails, abort
  // before the Payload doc — orphaned DB rows beat orphaned files.
  if (doc.bucket && doc.path) {
    const sb = supabaseAdmin();
    const { error } = await sb.storage.from(doc.bucket).remove([doc.path]);
    if (error) {
      return NextResponse.json(
        { error: `storage delete failed: ${error.message}` },
        { status: 502 },
      );
    }
  }

  try {
    await p.delete({ collection: 'media', id: mediaId, req: { user } as never });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'delete failed' },
      { status: 400 },
    );
  }
  return NextResponse.json({ ok: true });
}
