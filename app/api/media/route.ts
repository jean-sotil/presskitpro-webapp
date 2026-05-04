import { NextResponse } from 'next/server';

import { payload } from '@/lib/payload';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Body = {
  bucket: 'avatars' | 'gallery';
  path: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  alt: string;
  ownerSupabaseId: string;
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  if (!body.bucket || !body.path || !body.mimeType || !body.size || !body.alt || !body.ownerSupabaseId) {
    return NextResponse.json({ error: 'missing required fields' }, { status: 400 });
  }

  const sb = supabaseAdmin();

  // Confirm the object actually landed before persisting metadata —
  // prevents "phantom" Media docs when an upload was aborted.
  const { data: head, error: headErr } = await sb.storage
    .from(body.bucket)
    .createSignedUrl(body.path, 60);
  if (headErr || !head) {
    return NextResponse.json({ error: 'object not found in storage' }, { status: 404 });
  }

  const p = await payload();
  const owner = await p.find({
    collection: 'users',
    where: { supabaseUserId: { equals: body.ownerSupabaseId } },
    limit: 1,
  });
  const ownerDoc = owner.docs[0];
  if (!ownerDoc) {
    return NextResponse.json({ error: 'owner not yet synced' }, { status: 409 });
  }

  const created = await p.create({
    collection: 'media',
    data: {
      bucket: body.bucket,
      path: body.path,
      mimeType: body.mimeType,
      size: body.size,
      width: body.width,
      height: body.height,
      alt: body.alt,
      owner: ownerDoc.id,
    },
  });

  const { data: pub } = sb.storage.from(body.bucket).getPublicUrl(body.path);

  return NextResponse.json({ id: created.id, publicUrl: pub.publicUrl });
}
