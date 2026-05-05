import { redirect } from 'next/navigation';

import { Section } from '@/components/ui/Section';
import { SectionMarker } from '@/components/atmosphere/SectionMarker';
import { payload } from '@/lib/payload';
import {
  isComplete,
  type OnboardingProgress,
} from '@/lib/onboarding/state';
import { supabaseServer } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The layout has already gated for an authenticated user.
  if (!user) redirect('/login?next=/dashboard');

  // Onboarding gate: anyone without a finished wizard goes to /onboarding.
  // Idempotent against the wizard's own dashboard-redirect on completion —
  // once `completedAt` is set, we fall through.
  const p = await payload();
  const userResult = await p.find({
    collection: 'users',
    where: { supabaseUserId: { equals: user.id } },
    limit: 1,
    depth: 0,
  });
  const userDoc = userResult.docs[0];
  const progress = (userDoc?.onboardingProgress ?? null) as
    | OnboardingProgress
    | null;
  if (!isComplete(progress)) {
    redirect('/onboarding');
  }

  return (
    <main>
      <Section>
        <SectionMarker number={1} label="DASHBOARD" />
        <h1 className="mt-4 font-display text-5xl uppercase tracking-tight">
          Olá, {user.email}
        </h1>
        <p className="mt-4 max-w-prose text-text-muted">
          Esta é uma página temporária. O editor real chega na task-09.
        </p>

        <form action="/auth/logout" method="post" className="mt-8">
          <button
            type="submit"
            className="border border-border bg-transparent px-5 py-2 text-sm uppercase tracking-wider text-text hover:bg-surface focus-visible:outline-offset-2"
          >
            Sair
          </button>
        </form>
      </Section>
    </main>
  );
}
