import { describe, expect, it } from 'vitest';

import { nextHealth } from './next-health';

describe('nextHealth', () => {
  it('first success on a fresh profile -> healthy, fails reset to 0', () => {
    expect(nextHealth({ priorStatus: 'unknown', priorFails: 0, checkOk: true }))
      .toEqual({ status: 'healthy', fails: 0, transition: 'to-healthy' });
  });

  it('healthy + success -> stays healthy with no transition', () => {
    expect(nextHealth({ priorStatus: 'healthy', priorFails: 0, checkOk: true }))
      .toEqual({ status: 'healthy', fails: 0, transition: 'none' });
  });

  it('first failure -> still healthy, counter at 1, no email', () => {
    expect(nextHealth({ priorStatus: 'healthy', priorFails: 0, checkOk: false }))
      .toEqual({ status: 'healthy', fails: 1, transition: 'none' });
  });

  it('second consecutive failure -> warning + transition fires', () => {
    expect(nextHealth({ priorStatus: 'healthy', priorFails: 1, checkOk: false }))
      .toEqual({ status: 'warning', fails: 2, transition: 'to-warning' });
  });

  it('warning + another failure (3rd) -> broken + transition fires', () => {
    expect(nextHealth({ priorStatus: 'warning', priorFails: 2, checkOk: false }))
      .toEqual({ status: 'broken', fails: 3, transition: 'to-broken' });
  });

  it('broken + another failure -> stays broken, counter clamps at 3, no transition', () => {
    expect(nextHealth({ priorStatus: 'broken', priorFails: 3, checkOk: false }))
      .toEqual({ status: 'broken', fails: 3, transition: 'none' });
    expect(nextHealth({ priorStatus: 'broken', priorFails: 5, checkOk: false }))
      .toEqual({ status: 'broken', fails: 3, transition: 'none' });
  });

  it('warning + success -> back to healthy with transition', () => {
    expect(nextHealth({ priorStatus: 'warning', priorFails: 2, checkOk: true }))
      .toEqual({ status: 'healthy', fails: 0, transition: 'to-healthy' });
  });

  it('broken + success -> back to healthy with transition', () => {
    expect(nextHealth({ priorStatus: 'broken', priorFails: 3, checkOk: true }))
      .toEqual({ status: 'healthy', fails: 0, transition: 'to-healthy' });
  });

  it('unknown + failure -> still unknown until 2 consecutive (matches healthy semantics)', () => {
    // First-ever check failed: same posture as healthy first-fail.
    expect(nextHealth({ priorStatus: 'unknown', priorFails: 0, checkOk: false }))
      .toEqual({ status: 'healthy', fails: 1, transition: 'none' });
  });
});
