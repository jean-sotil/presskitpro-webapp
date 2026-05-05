/**
 * Dev-only magic-link generator.
 *
 * Uses the Supabase service-role key to generate a magic-link URL WITHOUT
 * sending an email — useful when the hosted free SMTP is rate-limited
 * (the public quota is ~4 emails/hour) or when you want a scripted login
 * during local development.
 *
 *   bun run dev:magic-link <email> [--next=/dashboard] [--origin=http://localhost:3000]
 *
 * Output: a single URL on stdout. Open it in the browser → /dashboard.
 *
 * SECURITY: never run this in production CI/CD. The service-role key
 * bypasses RLS — keep it in `.env` (already gitignored) and don't paste
 * it into shared logs.
 */
import { createClient } from '@supabase/supabase-js';

function parseArgs(argv: string[]) {
  const email = argv.find((a) => !a.startsWith('--'));
  const flag = (name: string, fallback: string) => {
    const hit = argv.find((a) => a.startsWith(`--${name}=`));
    return hit ? hit.slice(name.length + 3) : fallback;
  };
  return {
    email,
    next: flag('next', '/dashboard'),
    origin: flag('origin', process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  };
}

async function main() {
  const { email, next, origin } = parseArgs(process.argv.slice(2));

  if (!email || !email.includes('@')) {
    console.error('Usage: bun run dev:magic-link <email> [--next=/dashboard] [--origin=http://localhost:3000]');
    process.exit(2);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.');
    process.exit(1);
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}`;

  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo },
  });

  if (error || !data?.properties?.action_link) {
    console.error(`Failed to generate magic link: ${error?.message ?? 'no action_link in response'}`);
    process.exit(1);
  }

  console.log(data.properties.action_link);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
