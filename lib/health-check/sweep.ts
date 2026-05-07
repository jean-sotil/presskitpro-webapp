import type { CheckResult } from './check-press-kit-url';
import { nextHealth, type HealthStatus } from './next-health';

/**
 * Press-kit health sweep orchestrator (task-30).
 *
 * Pure DI on data + I/O so unit tests don't touch Payload, fetch, or
 * Resend. The cron route at `app/api/cron/press-kit-health/route.ts`
 * wires these deps to the live runtime.
 *
 * Concurrency: 10 in-flight checks at a time. Larger pools risk Drive
 * throttle responses; smaller leaves the 8s timeout dominating wall
 * time on big cohorts.
 */

const CONCURRENCY = 10;

export type SweepProfile = {
  id: number | string;
  slug: string;
  pressKitUrl: string;
  pressKitHealthStatus: HealthStatus;
  pressKitConsecutiveFails: number;
  defaultLocale: string;
  ownerEmail: string;
};

export type SweepProfilePatch = {
  pressKitHealthStatus: HealthStatus;
  pressKitConsecutiveFails: number;
  pressKitLastCheckedAt: string;
};

export type SweepDeps = {
  findCandidates(): Promise<SweepProfile[]>;
  checkUrl(url: string): Promise<CheckResult>;
  updateProfile(args: {
    profileId: number | string;
    patch: SweepProfilePatch;
  }): Promise<void>;
  sendWarningEmail(args: {
    profile: SweepProfile;
    to: string;
  }): Promise<void>;
  sendBrokenEmail(args: {
    profile: SweepProfile;
    to: string;
  }): Promise<void>;
  now(): Date;
};

export type SweepResult = {
  checked: number;
  healthy: number;
  transitionedToWarning: number;
  transitionedToBroken: number;
  transitionedToHealthy: number;
};

export async function sweepPressKitHealth(deps: SweepDeps): Promise<SweepResult> {
  const candidates = await deps.findCandidates();
  const result: SweepResult = {
    checked: 0,
    healthy: 0,
    transitionedToWarning: 0,
    transitionedToBroken: 0,
    transitionedToHealthy: 0,
  };

  // Run a fixed-size pool of `CONCURRENCY` concurrent checks.
  let cursor = 0;
  async function worker() {
    while (cursor < candidates.length) {
      const i = cursor++;
      const profile = candidates[i]!;
      await processOne(profile, deps, result);
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
  profile: SweepProfile,
  deps: SweepDeps,
  result: SweepResult,
): Promise<void> {
  const check = await deps.checkUrl(profile.pressKitUrl);
  const decision = nextHealth({
    priorStatus: profile.pressKitHealthStatus,
    priorFails: profile.pressKitConsecutiveFails,
    checkOk: check.ok,
  });
  await deps.updateProfile({
    profileId: profile.id,
    patch: {
      pressKitHealthStatus: decision.status,
      pressKitConsecutiveFails: decision.fails,
      pressKitLastCheckedAt: deps.now().toISOString(),
    },
  });
  result.checked++;
  if (decision.status === 'healthy' && decision.fails === 0) {
    result.healthy++;
  }
  if (decision.transition === 'to-warning') {
    result.transitionedToWarning++;
    await deps.sendWarningEmail({ profile, to: profile.ownerEmail });
  } else if (decision.transition === 'to-broken') {
    result.transitionedToBroken++;
    await deps.sendBrokenEmail({ profile, to: profile.ownerEmail });
  } else if (decision.transition === 'to-healthy') {
    result.transitionedToHealthy++;
  }
}
