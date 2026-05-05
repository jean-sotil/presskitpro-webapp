import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

import { resolvePayloadUserLive } from '@/lib/auth/payload-user-from-request';
import { payload as getPayloadInstance } from '@/lib/payload';
import { assertOwnsProfile } from '@/lib/editor/upsert-child';
import {
  type Platform,
  PLATFORMS,
  parseAndCanonicalize,
  validateLinks,
} from '@/lib/editor/social-link-validate';
import {
  reconcileSocialLinks,
  type ReconcileDeps,
  type ReconcileRow,
} from '@/lib/editor/social-links-reconcile';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type IncomingBody = {
  links?: Array<{ id?: number; platform?: string; url?: string }>;
};

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

  let body: IncomingBody;
  try {
    body = (await req.json()) as IncomingBody;
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const incoming = Array.isArray(body.links) ? body.links : null;
  if (!incoming) {
    return NextResponse.json({ error: 'links must be an array' }, { status: 400 });
  }

  // Reject unknown platforms early so validateLinks doesn't have to.
  const normalized: Array<{ id?: number; platform: Platform; url: string }> = [];
  for (let i = 0; i < incoming.length; i++) {
    const item = incoming[i]!;
    if (!item.platform || !PLATFORMS.includes(item.platform as Platform)) {
      return NextResponse.json(
        { error: 'invalid platform', index: i },
        { status: 400 },
      );
    }
    normalized.push({
      id: typeof item.id === 'number' ? item.id : undefined,
      platform: item.platform as Platform,
      url: typeof item.url === 'string' ? item.url : '',
    });
  }

  // Server-side validation + canonicalization. We never trust the user's
  // url string — rebuild every entry from parsed parts.
  const validation = validateLinks(normalized);
  if (!validation.ok) {
    return NextResponse.json(
      { error: 'validation failed', detail: validation },
      { status: 400 },
    );
  }
  const canonicalized = normalized.map((item) => {
    const parsed = parseAndCanonicalize(item.platform, item.url);
    // validateLinks already passed → parsed is ok, but TS needs the guard.
    const url = parsed.ok ? parsed.canonical : item.url;
    return { id: item.id, platform: item.platform, url };
  });

  try {
    const final = await reconcileSocialLinks(liveDeps(profileId, user), {
      profileId,
      incoming: canonicalized,
    });
    return NextResponse.json({ links: final });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'reconcile failed' },
      { status: 500 },
    );
  }
}

function liveDeps(
  profileId: number,
  user: Awaited<ReturnType<typeof resolvePayloadUserLive>>,
): ReconcileDeps {
  return {
    async listExisting() {
      const p = await getPayloadInstance();
      const result = await p.find({
        collection: 'social-links',
        where: { profile: { equals: profileId } },
        sort: 'displayOrder',
        limit: 100,
        depth: 0,
        req: { user } as never,
      });
      return result.docs.map((d) => ({
        id: Number(d.id),
        profile: profileId,
        platform: String((d as { platform: unknown }).platform),
        url: String((d as { url: unknown }).url),
        displayOrder: Number((d as { displayOrder?: unknown }).displayOrder ?? 0),
      })) satisfies ReconcileRow[];
    },
    async deleteRow(id) {
      const p = await getPayloadInstance();
      await p.delete({
        collection: 'social-links',
        id,
        req: { user } as never,
      });
    },
    async updateRow(id, data) {
      const p = await getPayloadInstance();
      await p.update({
        collection: 'social-links',
        id,
        data,
        req: { user } as never,
      });
    },
    async createRow(data) {
      const p = await getPayloadInstance();
      const created = await p.create({
        collection: 'social-links',
        data: data as never,
        req: { user } as never,
      });
      return {
        id: Number(created.id),
        profile: profileId,
        platform: String((created as { platform: unknown }).platform),
        url: String((created as { url: unknown }).url),
        displayOrder: Number(
          (created as { displayOrder?: unknown }).displayOrder ?? 0,
        ),
      };
    },
  };
}
