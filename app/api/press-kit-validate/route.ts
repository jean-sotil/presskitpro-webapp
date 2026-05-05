import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

import { resolvePayloadUserLive } from '@/lib/auth/payload-user-from-request';
import { validatePressKitUrl } from '@/lib/server/press-kit-validate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Validate an artist's press-kit URL.
 *
 * The editor calls this on blur / explicit "Validar" click; only on
 * `{ ok: true }` does the editor commit `pressKitUrl` to the bundle.
 * No side effects on the database — pure reachability check + provider
 * derivation.
 */
export async function POST(req: Request) {
  // Auth gate: any logged-in user. We don't need the profile-id because
  // the validator has no database side effects; this prevents the route
  // from being used as an open URL-prober.
  const user = await resolvePayloadUserLive(await headers());
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: { url?: unknown };
  try {
    body = (await req.json()) as { url?: unknown };
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  if (typeof body.url !== 'string') {
    return NextResponse.json({ error: 'url required' }, { status: 400 });
  }

  const result = await validatePressKitUrl({ url: body.url });
  return NextResponse.json(result);
}
