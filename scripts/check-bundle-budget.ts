#!/usr/bin/env tsx
/**
 * Task-26 — bundle-size budget gate.
 *
 * Compares the current build's First Load JS (per route) against
 * `bundles.lock.json` and fails CI when any route grows by more than
 * the lock's tolerance (default 10 KB) or appears without a baseline
 * entry. Run `pnpm/bun run bundle:update` to regenerate the lock when
 * a size change is intentional.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export type RouteSize = { route: string; firstLoadKB: number };

export type LockFile = {
  generated: string;
  toleranceKB: number;
  routes: Record<string, number>;
};

export type Violation =
  | {
      kind: 'over-budget';
      route: string;
      baselineKB: number;
      currentKB: number;
      deltaKB: number;
    }
  | { kind: 'new-route'; route: string; currentKB: number };

export type DiffResult = {
  ok: boolean;
  violations: Violation[];
  unchanged: number;
};

export function diffBundleSizes(args: {
  current: RouteSize[];
  lock: LockFile;
  toleranceKB: number;
}): DiffResult {
  const violations: Violation[] = [];
  let unchanged = 0;
  for (const { route, firstLoadKB } of args.current) {
    const baseline = args.lock.routes[route];
    if (baseline === undefined) {
      violations.push({ kind: 'new-route', route, currentKB: firstLoadKB });
      continue;
    }
    if (firstLoadKB > baseline + args.toleranceKB) {
      violations.push({
        kind: 'over-budget',
        route,
        baselineKB: baseline,
        currentKB: firstLoadKB,
        deltaKB: Math.round((firstLoadKB - baseline) * 100) / 100,
      });
      continue;
    }
    unchanged++;
  }
  return { ok: violations.length === 0, violations, unchanged };
}

// =====================================================================
// CLI side — only runs when invoked directly via `tsx scripts/...`.
// =====================================================================

const NEXT_DIR = path.resolve(process.cwd(), '.next');
const LOCK_FILE = path.resolve(process.cwd(), 'bundles.lock.json');
const DEFAULT_TOLERANCE_KB = 10;

async function readManifest(): Promise<Record<string, string[]>> {
  const file = path.join(NEXT_DIR, 'app-build-manifest.json');
  const raw = await fs.readFile(file, 'utf8');
  const parsed = JSON.parse(raw) as { pages?: Record<string, string[]> };
  return parsed.pages ?? {};
}

async function fileSize(rel: string): Promise<number> {
  const full = path.join(NEXT_DIR, rel);
  const st = await fs.stat(full);
  return st.size;
}

// `app-build-manifest.json` keys are like `/page`, `/[slug]/page`,
// `/dashboard/page`. Strip the trailing `/page` segment for readable
// keys in the lock file.
function normalizeRouteKey(key: string): string {
  if (key === '/page') return '/';
  return key.endsWith('/page') ? key.slice(0, -'/page'.length) : key;
}

async function deriveCurrentSizes(): Promise<RouteSize[]> {
  const pages = await readManifest();
  const out: RouteSize[] = [];
  for (const [route, files] of Object.entries(pages)) {
    let bytes = 0;
    for (const f of files) {
      try {
        bytes += await fileSize(f);
      } catch {
        // Stale manifest entries sometimes point at files dropped by
        // tree-shake; skip rather than fail the whole run.
      }
    }
    const firstLoadKB = Math.round((bytes / 1024) * 100) / 100;
    out.push({ route: normalizeRouteKey(route), firstLoadKB });
  }
  out.sort((a, b) => a.route.localeCompare(b.route));
  return out;
}

async function readLock(): Promise<LockFile> {
  const raw = await fs.readFile(LOCK_FILE, 'utf8');
  return JSON.parse(raw) as LockFile;
}

async function writeLock(current: RouteSize[]): Promise<void> {
  const existing = await readLock().catch(() => null);
  const tolerance = existing?.toleranceKB ?? DEFAULT_TOLERANCE_KB;
  const lock: LockFile = {
    generated: new Date().toISOString(),
    toleranceKB: tolerance,
    routes: Object.fromEntries(current.map((r) => [r.route, r.firstLoadKB])),
  };
  await fs.writeFile(LOCK_FILE, JSON.stringify(lock, null, 2) + '\n', 'utf8');
}

async function main(): Promise<void> {
  const update = process.argv.includes('--update');
  let current: RouteSize[];
  try {
    current = await deriveCurrentSizes();
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      console.error(
        '[bundle:check] build manifest not found at .next/app-build-manifest.json — run `bun run build` first.',
      );
      process.exit(2);
    }
    throw err;
  }
  if (update) {
    await writeLock(current);
    console.log(
      `[bundle:check] wrote bundles.lock.json with ${current.length} routes.`,
    );
    return;
  }
  let lock: LockFile;
  try {
    lock = await readLock();
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      console.error(
        '[bundle:check] bundles.lock.json missing — run `bun run bundle:update` to seed it.',
      );
      process.exit(2);
    }
    throw err;
  }
  const tolerance = lock.toleranceKB ?? DEFAULT_TOLERANCE_KB;
  const result = diffBundleSizes({ current, lock, toleranceKB: tolerance });
  if (result.ok) {
    console.log(
      `[bundle:check] OK — ${result.unchanged} routes within budget (tolerance ±${tolerance} KB).`,
    );
    return;
  }
  for (const v of result.violations) {
    if (v.kind === 'over-budget') {
      console.error(
        `[bundle:check] OVER ${v.route}: ${v.currentKB} KB (+${v.deltaKB} KB over baseline ${v.baselineKB} KB)`,
      );
    } else {
      console.error(
        `[bundle:check] NEW   ${v.route}: ${v.currentKB} KB (no baseline). Run \`bun run bundle:update\` after confirming the route is intentional.`,
      );
    }
  }
  console.error(
    `[bundle:check] FAIL — ${result.violations.length} violation(s). Accept by running \`bun run bundle:update\` and committing bundles.lock.json.`,
  );
  process.exit(1);
}

const invokedDirectly =
  !!process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (invokedDirectly) {
  void main();
}
