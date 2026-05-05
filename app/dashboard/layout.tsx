import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';

/**
 * Server-side session guard. Middleware does the same check using the
 * cookie alone; this layout's `auth.getUser()` actually validates the JWT
 * against Supabase, which is the real security boundary.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/dashboard');
  }

  return <>{children}</>;
}
