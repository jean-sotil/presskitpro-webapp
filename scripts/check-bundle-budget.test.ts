import { describe, expect, it } from 'vitest';

import { diffBundleSizes, type LockFile, type RouteSize } from './check-bundle-budget';

const lock: LockFile = {
  generated: '2026-05-06T00:00:00Z',
  toleranceKB: 10,
  routes: {
    '/': 120,
    '/[slug]': 220,
    '/dashboard': 180,
  },
};

describe('diffBundleSizes', () => {
  it('passes when every route is within tolerance', () => {
    const current: RouteSize[] = [
      { route: '/', firstLoadKB: 120 },
      { route: '/[slug]', firstLoadKB: 225 }, // +5 KB, within 10 KB tolerance
      { route: '/dashboard', firstLoadKB: 180 },
    ];
    const result = diffBundleSizes({ current, lock, toleranceKB: lock.toleranceKB });
    expect(result.ok).toBe(true);
    expect(result.violations).toHaveLength(0);
    expect(result.unchanged).toBe(3);
  });

  it('fails when a route exceeds baseline + tolerance', () => {
    const current: RouteSize[] = [
      { route: '/', firstLoadKB: 120 },
      { route: '/[slug]', firstLoadKB: 240 }, // +20 KB, over 10 KB tolerance
      { route: '/dashboard', firstLoadKB: 180 },
    ];
    const result = diffBundleSizes({ current, lock, toleranceKB: lock.toleranceKB });
    expect(result.ok).toBe(false);
    expect(result.violations).toEqual([
      {
        kind: 'over-budget',
        route: '/[slug]',
        baselineKB: 220,
        currentKB: 240,
        deltaKB: 20,
      },
    ]);
  });

  it('fails when a new route lacks a baseline entry', () => {
    const current: RouteSize[] = [
      { route: '/', firstLoadKB: 120 },
      { route: '/[slug]', firstLoadKB: 220 },
      { route: '/dashboard', firstLoadKB: 180 },
      { route: '/onboarding', firstLoadKB: 95 },
    ];
    const result = diffBundleSizes({ current, lock, toleranceKB: lock.toleranceKB });
    expect(result.ok).toBe(false);
    expect(result.violations).toEqual([
      { kind: 'new-route', route: '/onboarding', currentKB: 95 },
    ]);
  });

  it('reports every violation, not just the first', () => {
    const current: RouteSize[] = [
      { route: '/', firstLoadKB: 145 }, // +25 KB
      { route: '/[slug]', firstLoadKB: 240 }, // +20 KB
      { route: '/dashboard', firstLoadKB: 180 },
      { route: '/checkout', firstLoadKB: 88 }, // new
    ];
    const result = diffBundleSizes({ current, lock, toleranceKB: lock.toleranceKB });
    expect(result.ok).toBe(false);
    expect(result.violations).toHaveLength(3);
    const kinds = result.violations.map((v) => v.kind).sort();
    expect(kinds).toEqual(['new-route', 'over-budget', 'over-budget']);
  });

  it('treats baseline shrink as a pass (no penalty for getting smaller)', () => {
    const current: RouteSize[] = [
      { route: '/', firstLoadKB: 90 },
      { route: '/[slug]', firstLoadKB: 100 },
      { route: '/dashboard', firstLoadKB: 50 },
    ];
    const result = diffBundleSizes({ current, lock, toleranceKB: lock.toleranceKB });
    expect(result.ok).toBe(true);
    expect(result.unchanged).toBe(3);
  });
});
