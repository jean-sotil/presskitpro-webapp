'use server';

import { redirect } from 'next/navigation';

import { createPayPalSubscription, type CheckoutPlanKey } from '@/lib/billing/create-paypal-subscription';
import { payload } from '@/lib/payload';
import { supabaseServer } from '@/lib/supabase/server';

const KNOWN_PLAN_KEYS: ReadonlySet<CheckoutPlanKey> = new Set([
  'pro-monthly',
  'pro-annual',
  'agency-monthly',
  'agency-annual',
  'agency',
]);

function isPlanKey(value: string): value is CheckoutPlanKey {
  return KNOWN_PLAN_KEYS.has(value as CheckoutPlanKey);
}

export type CheckoutActionResult =
  | { ok: false; message: string }
  | { ok: true; redirectUrl: string };

export async function startCheckout(planId: string): Promise<CheckoutActionResult> {
  if (!isPlanKey(planId)) {
    return { ok: false, message: 'Plano desconhecido.' };
  }

  const supabase = await supabaseServer();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser?.email) {
    redirect(`/login?next=/checkout/${planId}`);
  }

  const p = await payload();
  const userResult = await p.find({
    collection: 'users',
    where: { supabaseUserId: { equals: authUser.id } },
    limit: 1,
    depth: 0,
  });
  const userDoc = userResult.docs[0];
  if (!userDoc) {
    return {
      ok: false,
      message: 'Sua conta ainda está sendo provisionada. Tente novamente em alguns segundos.',
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const result = await createPayPalSubscription({
    planKey: planId,
    user: {
      id: userDoc.id,
      email: authUser.email,
    },
    returnUrl: `${baseUrl}/checkout/success`,
    cancelUrl: `${baseUrl}/checkout/canceled`,
  });

  if (!result.ok) {
    return { ok: false, message: result.message };
  }

  // Critical: write subscriptionId before redirect so webhook can find user
  await p.update({
    collection: 'users',
    id: userDoc.id,
    data: { paypalSubscriptionId: result.subscriptionId },
    overrideAccess: true,
  });

  return { ok: true, redirectUrl: result.approveUrl };
}
