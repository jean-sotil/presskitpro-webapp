import Link from 'next/link';
import { redirect } from 'next/navigation';

import { AnalyticsChart } from '@/components/dashboard/AnalyticsChart';
import { TopReferrers } from '@/components/dashboard/TopReferrers';
import { Section } from '@/components/ui/Section';
import { SectionMarker } from '@/components/atmosphere/SectionMarker';
import { fetchRollupsForOwner } from '@/lib/analytics/supabase-events';
import { formatChart } from '@/lib/analytics/format-chart';
import { payload } from '@/lib/payload';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Analytics — PressKit Pro',
  robots: { index: false, follow: false },
};

const WINDOW_DAYS = 14;

function ymdOffset(today: Date, days: number): string {
  const d = new Date(today);
  d.setUTCDate(d.getUTCDate() + days);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default async function DashboardAnalyticsPage() {
  const supabaseAuth = await supabaseServer();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();
  if (!user) redirect('/login?next=/dashboard/analytics');

  const p = await payload();
  const userResult = await p.find({
    collection: 'users',
    where: { supabaseUserId: { equals: user.id } },
    limit: 1,
    depth: 0,
  });
  const userDoc = userResult.docs[0];
  if (!userDoc) redirect('/onboarding');

  const profilesResult = await p.find({
    collection: 'profiles',
    where: { owner: { equals: userDoc.id } },
    limit: 50,
    depth: 0,
  });
  const profileIds = profilesResult.docs.map((d) => Number(d.id));

  const today = new Date();
  const sinceDay = ymdOffset(today, -(WINDOW_DAYS - 1));
  const supabase = supabaseAdmin();
  const rows = await fetchRollupsForOwner(supabase, { profileIds, sinceDay });

  const pageViewShape = formatChart({ rows, today, eventType: 'page_view' });
  const pressKitShape = formatChart({ rows, today, eventType: 'press_kit_click' });

  const topReferrers = mergeTopReferrers(rows);

  return (
    <main>
      <Section>
        <SectionMarker number={1} label="ANALYTICS" />
        <h1 className="mt-4 font-display text-5xl uppercase tracking-tight">
          Tráfego do seu press kit
        </h1>
        <p className="mt-6 max-w-prose text-text-muted">
          Janela de 14 dias. Os números são atualizados pelo cron diário —
          não esperam atualização em tempo real.
        </p>

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          <AnalyticsChart shape={pageViewShape} label="Visitas" />
          <AnalyticsChart shape={pressKitShape} label="Cliques no press kit" />
        </div>

        <div className="mt-16 max-w-2xl">
          <h2 className="font-display text-xs uppercase tracking-widest text-text-muted">
            Top referenciadores (14 dias)
          </h2>
          <div className="mt-6">
            <TopReferrers rows={topReferrers} />
          </div>
        </div>

        <div className="mt-16">
          <Link
            href="/dashboard"
            className="font-display text-xs uppercase tracking-widest text-text-muted underline underline-offset-4 hover:text-text"
          >
            ← Voltar ao painel
          </Link>
        </div>
      </Section>
    </main>
  );
}

function mergeTopReferrers(
  rows: Array<{ topReferrers: Array<{ host: string; count: number }> }>,
): Array<{ host: string; count: number }> {
  const totals = new Map<string, number>();
  for (const r of rows) {
    for (const ref of r.topReferrers) {
      totals.set(ref.host, (totals.get(ref.host) ?? 0) + ref.count);
    }
  }
  return Array.from(totals.entries())
    .map(([host, count]) => ({ host, count }))
    .sort((a, z) => z.count - a.count || a.host.localeCompare(z.host))
    .slice(0, 5);
}
