import type { SupabaseClient } from '@supabase/supabase-js';

import { recordSlugChange as recordSlugChangeDefault } from '../../slug/operations';

/**
 * On every Profiles update, if the slug changed, record an entry in
 * `slug_redirects` so the old URL keeps working for the redirect TTL
 * (task-07: 90 days). Failures are swallowed — a missing redirect row
 * is bad UX but not data corruption, and we don't want to block a save.
 */

type Args = {
  operation: 'create' | 'update' | 'delete';
  doc: { slug?: string };
  previousDoc?: { slug?: string };
};

type Deps = {
  supabase: SupabaseClient;
  recordSlugChange?: typeof recordSlugChangeDefault;
};

export async function handleSlugChange(
  args: Args,
  deps: Deps,
): Promise<void> {
  if (args.operation !== 'update') return;
  const oldSlug = args.previousDoc?.slug;
  const newSlug = args.doc?.slug;
  if (!oldSlug || !newSlug || oldSlug === newSlug) return;

  const fn = deps.recordSlugChange ?? recordSlugChangeDefault;
  try {
    await fn(deps.supabase, { oldSlug, newSlug });
  } catch {
    // Intentional: slug-redirect lag is recoverable; saves must not fail.
  }
}
