import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';

import { payload } from '@/lib/payload';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type AuthRecord = {
  id: string;
  email?: string | null;
  raw_user_meta_data?: { full_name?: string; name?: string } | null;
};

type Payload = {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: 'users';
  schema: 'auth';
  record: AuthRecord | null;
  old_record: AuthRecord | null;
};

function constantTimeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export async function POST(req: Request) {
  const expected = process.env.SUPABASE_AUTH_WEBHOOK_SECRET;
  if (!expected) {
    return NextResponse.json({ error: 'webhook not configured' }, { status: 500 });
  }

  const provided = req.headers.get('x-webhook-secret') ?? '';
  if (!constantTimeEqual(provided, expected)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: Payload;
  try {
    body = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  if (body.schema !== 'auth' || body.table !== 'users') {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const p = await payload();

  if (body.type === 'DELETE') {
    const id = body.old_record?.id;
    if (!id) return NextResponse.json({ ok: true });
    const existing = await p.find({
      collection: 'users',
      where: { supabaseUserId: { equals: id } },
      limit: 1,
    });
    if (existing.docs[0]) {
      await p.delete({ collection: 'users', id: existing.docs[0].id });
    }
    return NextResponse.json({ ok: true, action: 'deleted' });
  }

  const rec = body.record;
  if (!rec?.id || !rec.email) {
    return NextResponse.json({ error: 'missing id or email' }, { status: 400 });
  }

  const displayName =
    rec.raw_user_meta_data?.full_name ?? rec.raw_user_meta_data?.name ?? null;

  const existing = await p.find({
    collection: 'users',
    where: { supabaseUserId: { equals: rec.id } },
    limit: 1,
  });

  if (existing.docs[0]) {
    await p.update({
      collection: 'users',
      id: existing.docs[0].id,
      data: {
        email: rec.email,
        ...(displayName ? { displayName } : {}),
      },
    });
    return NextResponse.json({ ok: true, action: 'updated' });
  }

  await p.create({
    collection: 'users',
    data: {
      supabaseUserId: rec.id,
      email: rec.email,
      displayName: displayName ?? undefined,
      role: 'user',
      plan: 'free',
    },
  });
  return NextResponse.json({ ok: true, action: 'created' });
}
