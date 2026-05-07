import { decideReclaimAction } from './decide-action';

/**
 * Slug-reclaim sweep orchestrator (task-32). Pure DI on data + I/O so
 * unit tests cover the matrix without touching Payload or Resend. The
 * cron route at `app/api/cron/slug-reclaim/route.ts` wires live deps.
 */

const CONCURRENCY = 10;

export type SweepCandidate = {
  profileId: number | string;
  slug: string;
  status: 'draft' | 'published' | 'unpublished' | 'paused' | 'soft-released';
  profileUpdatedAt: Date | null;
  ownerEmail: string;
  ownerLocale: string;
  lastSignInAt: Date | null;
  lastEventAt: Date | null;
  hasActiveSubscription: boolean;
  slugReclaimWarningAt: Date | null;
  slugSoftReleasedAt: Date | null;
};

export type SweepAuditEntry = {
  event:
    | 'slug_reclaim_warned'
    | 'slug_reclaim_soft_released'
    | 'slug_reclaim_finalized';
  profileId: number | string;
  slug: string;
  at: string;
};

export type SweepDeps = {
  findCandidates(): Promise<SweepCandidate[]>;
  sendWarning(args: {
    candidate: SweepCandidate;
    keepUrl: string;
  }): Promise<void>;
  sendReleased(args: { candidate: SweepCandidate }): Promise<void>;
  stampWarning(args: { profileId: number | string; at: Date }): Promise<void>;
  softRelease(args: { profileId: number | string; at: Date }): Promise<void>;
  finalizeRelease(args: {
    profileId: number | string;
    currentSlug: string;
  }): Promise<void>;
  audit(entry: SweepAuditEntry): void;
  now(): Date;
  keepUrlBuilder(args: {
    profileId: number | string;
    warningAt: Date;
  }): string;
};

export type SweepResult = {
  checked: number;
  warned: number;
  released: number;
  finalized: number;
  skipped: number;
};

export async function sweepInactiveSlugs(deps: SweepDeps): Promise<SweepResult> {
  const candidates = await deps.findCandidates();
  const result: SweepResult = {
    checked: 0,
    warned: 0,
    released: 0,
    finalized: 0,
    skipped: 0,
  };
  let cursor = 0;
  async function worker() {
    while (cursor < candidates.length) {
      const i = cursor++;
      const candidate = candidates[i]!;
      await processOne(candidate, deps, result);
    }
  }
  const workers = Array.from(
    { length: Math.min(CONCURRENCY, candidates.length) },
    () => worker(),
  );
  await Promise.all(workers);
  return result;
}

async function processOne(
  candidate: SweepCandidate,
  deps: SweepDeps,
  result: SweepResult,
): Promise<void> {
  result.checked++;
  const now = deps.now();
  const action = decideReclaimAction({
    now,
    profile: {
      status: candidate.status,
      updatedAt: candidate.profileUpdatedAt,
      slugReclaimWarningAt: candidate.slugReclaimWarningAt,
      slugSoftReleasedAt: candidate.slugSoftReleasedAt,
    },
    lastSignInAt: candidate.lastSignInAt,
    lastEventAt: candidate.lastEventAt,
    hasActiveSubscription: candidate.hasActiveSubscription,
  });
  switch (action) {
    case 'skip':
      result.skipped++;
      return;
    case 'warn': {
      const keepUrl = deps.keepUrlBuilder({
        profileId: candidate.profileId,
        warningAt: now,
      });
      await deps.sendWarning({ candidate, keepUrl });
      await deps.stampWarning({ profileId: candidate.profileId, at: now });
      deps.audit({
        event: 'slug_reclaim_warned',
        profileId: candidate.profileId,
        slug: candidate.slug,
        at: now.toISOString(),
      });
      result.warned++;
      return;
    }
    case 'release': {
      await deps.sendReleased({ candidate });
      await deps.softRelease({ profileId: candidate.profileId, at: now });
      deps.audit({
        event: 'slug_reclaim_soft_released',
        profileId: candidate.profileId,
        slug: candidate.slug,
        at: now.toISOString(),
      });
      result.released++;
      return;
    }
    case 'finalize':
      await deps.finalizeRelease({
        profileId: candidate.profileId,
        currentSlug: candidate.slug,
      });
      deps.audit({
        event: 'slug_reclaim_finalized',
        profileId: candidate.profileId,
        slug: candidate.slug,
        at: now.toISOString(),
      });
      result.finalized++;
      return;
  }
}
