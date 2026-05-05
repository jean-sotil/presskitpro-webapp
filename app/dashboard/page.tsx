import { Section } from '@/components/ui/Section';
import { SectionMarker } from '@/components/atmosphere/SectionMarker';
import { supabaseServer } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main>
      <Section>
        <SectionMarker number={1} label="DASHBOARD" />
        <h1 className="mt-4 font-display text-5xl uppercase tracking-tight">
          Olá, {user?.email}
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
