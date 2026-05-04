import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';

import { supabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_BUCKETS = new Set(['avatars', 'gallery']);
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
const MAX_BYTES = 10 * 1024 * 1024; // 10MB hard ceiling — client is expected to compress to ~2MB.

type Body = { bucket: string; mimeType: string; size: number; ownerSupabaseId: string };

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  if (!ALLOWED_BUCKETS.has(body.bucket)) {
    return NextResponse.json({ error: 'invalid bucket' }, { status: 400 });
  }
  if (!ALLOWED_MIME.has(body.mimeType)) {
    return NextResponse.json({ error: 'unsupported mime type' }, { status: 400 });
  }
  if (typeof body.size !== 'number' || body.size <= 0 || body.size > MAX_BYTES) {
    return NextResponse.json({ error: 'invalid size' }, { status: 400 });
  }
  if (!body.ownerSupabaseId) {
    return NextResponse.json({ error: 'missing owner' }, { status: 400 });
  }

  const ext = body.mimeType.split('/')[1] ?? 'bin';
  const path = `${body.ownerSupabaseId}/${randomUUID()}.${ext}`;

  const sb = supabaseAdmin();
  const { data, error } = await sb.storage.from(body.bucket).createSignedUploadUrl(path);
  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'sign failed' }, { status: 500 });
  }

  return NextResponse.json({
    bucket: body.bucket,
    path: data.path,
    token: data.token,
    signedUrl: data.signedUrl,
  });
}
