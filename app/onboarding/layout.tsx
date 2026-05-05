import { redirect } from 'next/navigation';

import { payload } from '@/lib/payload';
import { isComplete, type OnboardingProgress } from '@/lib/onboarding/state';
import { supabaseServer } from '@/lib/supabase/server';

/**
 * Auth gate + completed-already redirect.
 *
 * Middleware (`/middleware.ts`) bounces unauthenticated users to /login;
 * here we re-validate the session with `auth.getUser()` (real signature
 * check, the actual security boundary) and short-circuit users who have
 * already completed onboarding.
 */
export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) {
    redirect('/login?next=/onboarding');
  }

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
  if (isComplete(progress)) {
    redirect('/dashboard');
  }

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-screen-xl flex-col gap-12 px-6 py-12 md:flex-row md:gap-16 md:py-16">
      {children}
    </div>
  );
}
