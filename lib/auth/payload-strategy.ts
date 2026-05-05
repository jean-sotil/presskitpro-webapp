import 'server-only';

import type { AuthStrategy, AuthStrategyFunction } from 'payload';

import {
  type SupabaseUserSummary,
  verifySupabaseSession,
} from './verify-supabase-session';

/**
 * Custom Payload auth strategy that delegates session verification to
 * Supabase Auth (canonical, per ADR-0001) and looks up the mirrored
 * Payload `Users` row by `supabaseUserId`.
 *
 * Strict-require posture: if no Payload `Users` row matches yet (the
 * auth-sync webhook hasn't fired), we return `null` rather than
 * auto-provisioning. The mirror is the auth-sync webhook's job; mixing
 * write-paths leads to drift.
 */

export type SupabaseStrategyDeps = {
  verifySession?: (headers: Headers) => Promise<SupabaseUserSummary | null>;
};

export function supabaseStrategy(deps: SupabaseStrategyDeps = {}): AuthStrategy {
  const verifySession = deps.verifySession ?? verifySupabaseSession;

  const authenticate: AuthStrategyFunction = async ({ headers, payload }) => {
    let summary: SupabaseUserSummary | null;
    try {
      summary = await verifySession(headers);
    } catch {
      return { user: null };
    }
    if (!summary) return { user: null };

    const result = await payload.find({
      collection: 'users',
      where: { supabaseUserId: { equals: summary.supabaseUserId } },
      limit: 1,
      depth: 0,
    });
    const doc = result.docs[0];
    if (!doc) return { user: null };

    return {
      user: {
        ...(doc as unknown as Record<string, unknown>),
        collection: 'users',
        _strategy: 'supabase',
      } as never,
    };
  };

  return { name: 'supabase', authenticate };
}
