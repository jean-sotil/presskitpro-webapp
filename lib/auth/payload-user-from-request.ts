import 'server-only';

import { payload as getPayloadInstance } from '../payload';
import {
  type SupabaseUserSummary,
  verifySupabaseSession,
} from './verify-supabase-session';

/**
 * REST handler convenience: resolve the request's Supabase session into
 * a Payload `users` doc. Returns null on auth failure / mirror lag /
 * any I/O error — the caller surfaces 401.
 *
 * The returned doc is shaped to match Payload's `req.user` ({ ...doc,
 * collection: 'users' }) so that handing it to `payload.update({ ..., user })`
 * triggers the access predicates from task-08.
 */

export type PayloadUserDoc = {
  id: number | string;
  supabaseUserId: string;
  email?: string;
  collection: 'users';
  [key: string]: unknown;
};

export type ResolveDeps = {
  verifySession: (headers: Headers) => Promise<SupabaseUserSummary | null>;
  findPayloadUser: (supabaseUserId: string) => Promise<PayloadUserDoc | null>;
};

export async function resolvePayloadUser(
  headers: Headers,
  deps: ResolveDeps,
): Promise<PayloadUserDoc | null> {
  let summary: SupabaseUserSummary | null;
  try {
    summary = await deps.verifySession(headers);
  } catch {
    return null;
  }
  if (!summary) return null;
  try {
    return await deps.findPayloadUser(summary.supabaseUserId);
  } catch {
    return null;
  }
}

/**
 * Production wiring: real verifySession + Payload Local API lookup. Use
 * from API route handlers (`headers()` → resolvePayloadUserLive).
 */
export async function resolvePayloadUserLive(
  headers: Headers,
): Promise<PayloadUserDoc | null> {
  return resolvePayloadUser(headers, {
    verifySession: verifySupabaseSession,
    findPayloadUser: async (supabaseUserId) => {
      const p = await getPayloadInstance();
      const result = await p.find({
        collection: 'users',
        where: { supabaseUserId: { equals: supabaseUserId } },
        limit: 1,
        depth: 0,
      });
      const doc = result.docs[0];
      if (!doc) return null;
      return {
        ...(doc as unknown as Record<string, unknown>),
        id: doc.id,
        supabaseUserId: doc.supabaseUserId,
        collection: 'users',
      } as PayloadUserDoc;
    },
  });
}
