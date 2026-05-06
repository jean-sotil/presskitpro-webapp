import Link from 'next/link';
import { redirect } from 'next/navigation';

import { TrialBanner } from '@/components/dashboard/TrialBanner';
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

  if (!user) redirect('/login?next=/dashboard');

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

  const profilesResult = userDoc
    ? await p.find({
        collection: 'profiles',
        where: { owner: { equals: userDoc.id } },
        sort: '-updatedAt',
        limit: 20,
        depth: 0,
      })
    : { docs: [] as Array<{ id: number | string; slug: string; status: string; updatedAt?: string }> };

  return (
    <main id="main">
      <Section>
        <SectionMarker number={1} label="DASHBOARD" />
        <h1 className="mt-4 font-display text-5xl uppercase tracking-tight">
          Olá, {user.email}
        </h1>

        {userDoc ? (
          <div className="mt-8">
            <TrialBanner
              user={{
                plan: userDoc.plan,
                trialEndsAt:
                  typeof userDoc.trialEndsAt === 'string'
                    ? userDoc.trialEndsAt
                    : (userDoc.trialEndsAt as Date | null) ?? null,
                stripeSubscriptionStatus:
                  (userDoc.stripeSubscriptionStatus as
                    | 'active'
                    | 'past_due'
                    | 'canceled'
                    | null
                    | undefined) ?? null,
              }}
            />
          </div>
        ) : null}

        {profilesResult.docs.length === 0 ? (
          <p className="mt-6 max-w-prose text-text-muted">
            Você ainda não tem perfis. <Link href="/onboarding" className="underline">Comece o onboarding →</Link>
          </p>
        ) : (
          <ul className="mt-8 grid gap-4 md:grid-cols-2">
            {profilesResult.docs.map((doc) => {
              const profile = doc as {
                id: number | string;
                slug: string;
                status: 'draft' | 'published' | 'unpublished';
                updatedAt?: string;
              };
              return (
                <li key={String(profile.id)} className="border border-border bg-surface p-6">
                  <p className="font-display text-xs uppercase tracking-widest text-text-muted">
                    {profile.status}
                  </p>
                  <p className="mt-2 font-display text-2xl uppercase tracking-tight">
                    presskit.pro/{profile.slug}
                  </p>
                  <Link
                    href={`/dashboard/profile/${profile.id}`}
                    className="mt-6 inline-flex h-10 items-center border border-border bg-transparent px-5 text-xs uppercase tracking-wider text-text hover:bg-bg focus-visible:outline-offset-2"
                  >
                    Abrir editor
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-12 flex items-center gap-6">
          <Link
            href="/dashboard/analytics"
            className="font-display text-xs uppercase tracking-widest text-text underline underline-offset-4 hover:text-text-muted"
          >
            Analytics →
          </Link>
          <form action="/auth/logout" method="post">
            <button
              type="submit"
              className="text-xs uppercase tracking-wider text-text-muted underline underline-offset-4 hover:text-text"
            >
              Sair
            </button>
          </form>
        </div>
      </Section>
    </main>
  );
}
