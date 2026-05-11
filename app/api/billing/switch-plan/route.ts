import { NextResponse } from 'next/server';

import { getPayPalClientOrThrow } from '@/lib/billing/paypal-client';
import { switchPlan, type SwitchPlanKey } from '@/lib/billing/switch-plan';
import { payload } from '@/lib/payload';
import { supabaseServer } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_KEYS = new Set<SwitchPlanKey>([
  'pro-monthly',
  'pro-annual',
  'agency-monthly',
  'agency-annual',
]);

/**
 * POST /api/billing/switch-plan (task-31).
 *
 * Body: `{ planKey: SwitchPlanKey }`. Updates the caller's existing
 * Stripe subscription with proration; the webhook fires
 * `customer.subscription.updated` shortly after and flips
 * `Users.plan` for the recipient.
 */
export async function POST(req: Request) {
  // 1) Caller must be authenticated.
  const supabase = await supabaseServer();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();
  if (!supabaseUser) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // 2) Body shape.
  let body: { planKey?: string };
  try {
    body = (await req.json()) as { planKey?: string };
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  const planKey = body.planKey;
  if (!planKey || !VALID_KEYS.has(planKey as SwitchPlanKey)) {
    return NextResponse.json({ error: 'invalid plan' }, { status: 400 });
  }

  // 3) Resolve the Payload user that mirrors the Supabase auth user.
  const p = await payload();
  const found = await p.find({
    collection: 'users',
    where: { supabaseUserId: { equals: supabaseUser.id } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  const payloadUser = found.docs[0] as
    | { id: number | string; paypalSubscriptionId?: string | null }
    | undefined;
  if (!payloadUser) {
    return NextResponse.json({ error: 'user-not-found' }, { status: 404 });
  }

  // 4) PayPal client — surface an explicit error when unconfigured rather
  //    than a generic 500.
  let paypal;
  try {
    paypal = getPayPalClientOrThrow();
  } catch {
    return NextResponse.json({ error: 'paypal-not-configured' }, { status: 503 });
  }

  const result = await switchPlan({
    userId: payloadUser.id,
    planKey: planKey as SwitchPlanKey,
    deps: {
      async findUser(id) {
        if (id !== payloadUser.id) return null;
        return {
          id: payloadUser.id,
          paypalSubscriptionId: payloadUser.paypalSubscriptionId ?? null,
        };
      },
      paypal,
    },
  });
  if (!result.ok) {
    const status =
      result.reason === 'no-subscription'
        ? 409
        : result.reason === 'unknown-plan'
          ? 400
          : result.reason === 'user-not-found'
            ? 404
            : 500;
    return NextResponse.json({ error: result.reason, message: result.message }, { status });
  }
  return NextResponse.json({
    ok: true,
    subscriptionId: result.subscriptionId,
    status: result.status,
  });
}
