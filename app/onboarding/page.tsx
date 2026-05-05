import { redirect } from 'next/navigation';

import { payload } from '@/lib/payload';
import { type OnboardingProgress, resumeStep } from '@/lib/onboarding/state';
import { supabaseServer } from '@/lib/supabase/server';

/**
 * Server-redirects to `/onboarding/<resumeStep>` so the URL always
 * reflects the user's current position. Bookmarking `/onboarding`
 * keeps working across sessions.
 */
export default async function OnboardingRoot() {
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect('/login?next=/onboarding');

  const p = await payload();
  const result = await p.find({
    collection: 'users',
    where: { supabaseUserId: { equals: user.id } },
    limit: 1,
    depth: 0,
  });
  const progress = (result.docs[0]?.onboardingProgress ?? null) as
    | OnboardingProgress
    | null;
  redirect(`/onboarding/${resumeStep(progress)}`);
}
