import { NextResponse } from 'next/server';
import { getTranslations } from 'next-intl/server';

import { payload } from '@/lib/payload';
import { verifyKeepSlugToken } from '@/lib/slug-reclaim/keep-slug-token';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/slug/keep?token=<sig>
 *
 * One-click "keep my slug" action linked from the Day-23 inactivity
 * warning email (task-32). Verifies the HMAC token, clears
 * `slugReclaimWarningAt` on the profile, and renders a small success
 * page in the owner's locale. No login required — the signed token IS
 * the auth.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token') ?? '';
  if (!token) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const verified = verifyKeepSlugToken(token);
  if (!verified.ok) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const p = await payload();
  let slug = '';
  try {
    const profile = await p.findByID({
      collection: 'profiles',
      id: verified.profileId,
      depth: 0,
      overrideAccess: true,
    });
    const stamp = (profile as { slugReclaimWarningAt?: string }).slugReclaimWarningAt;
    // Defense-in-depth: reject if the profile's warning timestamp
    // doesn't match the token's. A stale token can't revive a slug
    // that's already been re-warned (each warning rotates the
    // expected timestamp).
    if (!stamp || new Date(stamp).toISOString() !== verified.warningAt) {
      return NextResponse.json({ error: 'token-stale' }, { status: 410 });
    }
    slug = String((profile as { slug?: string }).slug ?? '');
    await p.update({
      collection: 'profiles',
      id: verified.profileId,
      data: {
        slugReclaimWarningAt: null,
        // If the slug went soft-released within the last 24h (race
        // window), revert that too. After 24h finalize has already
        // rotated the slug; nothing to revert beyond clearing the
        // warning timestamp for the next cycle.
        ...((profile as { status?: string }).status === 'soft-released'
          ? { status: 'published', slugSoftReleasedAt: null }
          : {}),
      },
      overrideAccess: true,
    });
  } catch {
    return NextResponse.json({ error: 'not-found' }, { status: 404 });
  }

  const t = await getTranslations('slug.keepSuccess');
  const html = `<!doctype html><meta charset="utf-8"><title>${escapeHtml(t('title'))}</title><body style="font-family:system-ui;padding:2rem;max-width:32rem;margin:0 auto"><h1>${escapeHtml(t('title'))}</h1><p>${escapeHtml(t('body', { slug }))}</p></body>`;
  return new NextResponse(html, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
