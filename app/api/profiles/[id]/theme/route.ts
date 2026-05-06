import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

import { resolvePayloadUserLive } from '@/lib/auth/payload-user-from-request';
import { deriveThemeTokens } from '@/lib/design/derive-theme-tokens';
import { validateThemeContrast } from '@/lib/design/validate-theme-contrast';
import { assertOwnsProfile, upsertProfileChild } from '@/lib/editor/upsert-child';
import { payload as getPayloadInstance } from '@/lib/payload';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// `contrastValidatedAt` is server-managed — never trust the client. We
// re-derive tokens after every save and bump the timestamp on pass.
const PATCHABLE = new Set([
  'colorPresetId',
  'accentPresetId',
  'bg',
  'accent',
  'text',
  'fontPairId',
  'heroStyle',
  'galleryLayout',
  'sectionOrder',
]);

const COLOR_FIELDS = new Set([
  'colorPresetId',
  'accentPresetId',
  'bg',
  'accent',
  'text',
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
    let updated = (await upsertProfileChild({
      collection: 'themes',
      profileId,
      data,
      user,
    })) as unknown as Record<string, unknown>;

    // Re-validate contrast server-side. Bump `contrastValidatedAt` only
    // when (a) this PATCH touched a color field AND (b) the resulting
    // tokens pass both AA thresholds. Non-color edits leave the
    // timestamp alone — a font/layout change shouldn't reset the gate.
    const touchedColors = Object.keys(data).some((k) => COLOR_FIELDS.has(k));
    const tokens = deriveThemeTokens(updated as never);
    const contrast = validateThemeContrast(tokens);
    if (touchedColors && contrast.ok) {
      const p = await getPayloadInstance();
      updated = (await p.update({
        collection: 'themes',
        id: updated.id as number,
        data: { contrastValidatedAt: new Date().toISOString() },
        req: { user } as never,
      })) as unknown as Record<string, unknown>;
    }
    return NextResponse.json({ ...updated, contrast });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'update failed' },
      { status: 400 },
    );
  }
}
