import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

import { resolvePayloadUserLive } from '@/lib/auth/payload-user-from-request';
import { payload as getPayloadInstance } from '@/lib/payload';
import { assertOwnsProfile } from '@/lib/editor/upsert-child';
import { fetchInstagramOembed } from '@/lib/server/instagram-oembed';
import { parseInstagramPostUrl } from '@/lib/server/instagram-validate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_POSTS = 6;
const STALE_AFTER_MS = 24 * 60 * 60 * 1000; // 24h

type IncomingPost = { id?: number; url?: unknown };

/**
 * Bulk-replace endpoint for `InstagramPosts`. Body shape:
 *   { posts: [{ id?, url }], force?: boolean }
 * The route reconciles existing rows against the incoming list:
 *   - rows whose IDs are absent → DELETE
 *   - rows with IDs and same canonical URL → UPDATE (skip oEmbed unless
 *     `force` or `fetchedAt` > 24h)
 *   - new rows (no ID) → CREATE + fetch oEmbed
 * `displayOrder` is rewritten from incoming array index. IDs are
 * preserved across saves so the editor's optimistic state doesn't churn.
 */
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

  let body: { posts?: unknown; force?: unknown };
  try {
    body = (await req.json()) as { posts?: unknown; force?: unknown };
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const incoming = Array.isArray(body.posts) ? (body.posts as IncomingPost[]) : null;
  if (!incoming) {
    return NextResponse.json(
      { error: 'posts must be an array' },
      { status: 400 },
    );
  }
  if (incoming.length > MAX_POSTS) {
    return NextResponse.json({ error: 'too-many', max: MAX_POSTS }, { status: 400 });
  }
  const force = body.force === true;

  // Validate every URL up front. If any fails, we reject the whole batch
  // so the editor doesn't half-save.
  const validated: Array<{ id?: number; canonical: string; rawUrl: string }> = [];
  for (let i = 0; i < incoming.length; i++) {
    const item = incoming[i]!;
    if (typeof item.url !== 'string') {
      return NextResponse.json(
        { error: 'invalid post', index: i, reason: 'missing-url' },
        { status: 400 },
      );
    }
    const parsed = parseInstagramPostUrl(item.url);
    if (!parsed.ok) {
      return NextResponse.json(
        { error: 'invalid post', index: i, reason: parsed.reason },
        { status: 400 },
      );
    }
    validated.push({
      id: typeof item.id === 'number' ? item.id : undefined,
      canonical: parsed.canonical,
      rawUrl: item.url,
    });
  }

  const p = await getPayloadInstance();
  const existingResult = await p.find({
    collection: 'instagram-posts',
    where: { profile: { equals: profileId } },
    limit: 100,
    depth: 0,
    req: { user } as never,
  });
  const existing = existingResult.docs as Array<{
    id: number;
    url?: string;
    oembedHtml?: string | null;
    fetchedAt?: string | null;
  }>;
  const incomingIds = new Set(
    validated.map((v) => v.id).filter((x): x is number => typeof x === 'number'),
  );

  // Delete absent rows.
  for (const row of existing) {
    if (!incomingIds.has(row.id)) {
      await p.delete({
        collection: 'instagram-posts',
        id: row.id,
        req: { user } as never,
      });
    }
  }

  const accessToken = process.env.INSTAGRAM_OEMBED_ACCESS_TOKEN;
  const out: Array<Record<string, unknown>> = [];

  for (let i = 0; i < validated.length; i++) {
    const item = validated[i]!;
    const prior = item.id ? existing.find((e) => e.id === item.id) : undefined;
    const fresh =
      prior?.fetchedAt &&
      Date.now() - new Date(prior.fetchedAt).getTime() < STALE_AFTER_MS;
    const sameUrl = prior?.url === item.canonical;
    const skipFetch = !force && prior && sameUrl && fresh && prior.oembedHtml;

    let data: Record<string, unknown>;
    if (skipFetch) {
      data = {
        profile: profileId,
        url: item.canonical,
        oembedHtml: prior!.oembedHtml,
        fetchedAt: prior!.fetchedAt,
        displayOrder: i,
      };
    } else {
      const result = await fetchInstagramOembed({
        url: item.canonical,
        accessToken,
      });
      if (!result.ok) {
        return NextResponse.json(
          { error: 'oembed-failed', index: i, reason: result.reason },
          { status: 502 },
        );
      }
      data = {
        profile: profileId,
        url: item.canonical,
        oembedHtml: result.oembedHtml,
        fetchedAt: result.fetchedAt,
        displayOrder: i,
      };
    }

    if (item.id) {
      const updated = await p.update({
        collection: 'instagram-posts',
        id: item.id,
        data: data as never,
        req: { user } as never,
      });
      out.push(updated as never);
    } else {
      const created = await p.create({
        collection: 'instagram-posts',
        data: data as never,
        req: { user } as never,
      });
      out.push(created as never);
    }
  }

  return NextResponse.json({ ok: true, posts: out });
}
