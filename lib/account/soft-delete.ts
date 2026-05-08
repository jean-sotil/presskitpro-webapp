/**
 * Soft-delete decision (task-33 PR-A).
 *
 * Pure function over the typed-email confirmation. Returns the patch
 * the server action applies to `Users` plus an `alreadyMarked` flag
 * so the caller knows whether to send a fresh "deletion requested"
 * email or stay quiet on a re-confirm.
 *
 * The server action wires this with live Supabase + Payload deps; the
 * cascade (flipping every owned Profile to `unpublished`) lives in
 * the action, not here.
 */

export type SoftDeleteUser = {
  id: number | string;
  email: string | null;
  deletionRequestedAt: string | null;
};

export type SoftDeleteInput = {
  user: SoftDeleteUser | null;
  confirmEmail: string;
  now: Date;
};

export type SoftDeleteResult =
  | {
      ok: true;
      patch: { deletionRequestedAt?: string };
      alreadyMarked: boolean;
    }
  | { ok: false; reason: 'user-not-found' | 'email-mismatch' };

export function decideSoftDelete(input: SoftDeleteInput): SoftDeleteResult {
  if (!input.user || !input.user.email) {
    return { ok: false, reason: 'user-not-found' };
  }
  const expected = normalizeEmailForConfirm(input.user.email);
  const actual = normalizeEmailForConfirm(input.confirmEmail);
  if (!expected || expected !== actual) {
    return { ok: false, reason: 'email-mismatch' };
  }
  if (input.user.deletionRequestedAt) {
    return { ok: true, patch: {}, alreadyMarked: true };
  }
  return {
    ok: true,
    patch: { deletionRequestedAt: input.now.toISOString() },
    alreadyMarked: false,
  };
}

export function normalizeEmailForConfirm(value: string | null | undefined): string {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase();
}
