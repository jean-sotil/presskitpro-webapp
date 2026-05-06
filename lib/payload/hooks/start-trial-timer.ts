/**
 * Profiles afterChange: on first profile creation, set the owner's
 * `trialEndsAt = now + 14d`. Idempotent — once set, subsequent profile
 * creates leave the timer alone.
 *
 * The trial timer lives on `Users` (not Stripe) so we can run the
 * "no card required" UX entirely from our own DB. See plan-doc Decision #1.
 */

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

type Args = {
  operation: 'create' | 'update' | 'delete';
  doc: {
    owner?: number | string | { id: number | string } | null;
  };
};

export type StartTrialTimerDeps = {
  now: () => Date;
  findUserById: (
    id: number | string,
  ) => Promise<{ id: number | string; trialEndsAt: string | null } | null>;
  updateUser: (
    id: number | string,
    patch: { trialEndsAt: string },
  ) => Promise<void>;
};

export async function handleStartTrialTimer(
  args: Args,
  deps: StartTrialTimerDeps,
): Promise<void> {
  if (args.operation !== 'create') return;
  const ownerRef = args.doc?.owner;
  if (ownerRef === undefined || ownerRef === null) return;
  const ownerId =
    typeof ownerRef === 'object' && ownerRef !== null ? ownerRef.id : ownerRef;

  const owner = await deps.findUserById(ownerId);
  if (!owner) return;
  if (owner.trialEndsAt) return; // already running

  const trialEndsAt = new Date(deps.now().getTime() + FOURTEEN_DAYS_MS).toISOString();
  await deps.updateUser(ownerId, { trialEndsAt });
}
