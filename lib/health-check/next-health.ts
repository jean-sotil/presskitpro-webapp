/**
 * Press-kit health-check state machine (task-30).
 *
 * Encodes the spec's transition rules in a single pure function so the
 * sweep orchestrator and the cron route never duplicate the math:
 *
 *   - 1st failure: stay `healthy`, counter = 1, no email.
 *   - 2nd consecutive failure: flip to `warning`, counter = 2, send warning.
 *   - 3rd consecutive failure: flip to `broken`, counter = 3, send broken.
 *   - Subsequent failures: counter clamps at 3, status stays `broken`.
 *   - Any success: counter resets to 0, status becomes `healthy`. The
 *     transition is `to-healthy` if the prior status wasn't healthy
 *     (so the artist sees a recovery email if we ever wire one).
 */

export type HealthStatus = 'unknown' | 'healthy' | 'warning' | 'broken';
export type HealthTransition = 'none' | 'to-healthy' | 'to-warning' | 'to-broken';

export type NextHealthInput = {
  priorStatus: HealthStatus;
  priorFails: number;
  checkOk: boolean;
};

export type NextHealthResult = {
  status: HealthStatus;
  fails: number;
  transition: HealthTransition;
};

const MAX_FAILS = 3;

export function nextHealth(input: NextHealthInput): NextHealthResult {
  if (input.checkOk) {
    const transition: HealthTransition =
      input.priorStatus === 'healthy' ? 'none' : 'to-healthy';
    return { status: 'healthy', fails: 0, transition };
  }

  const fails = Math.min(input.priorFails + 1, MAX_FAILS);

  if (fails >= 3) {
    const transition: HealthTransition =
      input.priorStatus === 'broken' ? 'none' : 'to-broken';
    return { status: 'broken', fails, transition };
  }

  if (fails === 2) {
    const transition: HealthTransition =
      input.priorStatus === 'warning' ? 'none' : 'to-warning';
    return { status: 'warning', fails, transition };
  }

  // First failure — keep status as healthy (it isn't yet a problem).
  return { status: 'healthy', fails, transition: 'none' };
}
