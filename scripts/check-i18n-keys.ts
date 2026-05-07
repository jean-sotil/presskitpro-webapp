#!/usr/bin/env tsx
/**
 * Task-29 — i18n key-parity gate.
 *
 * Walks every key in `messages/pt.json` (the reference catalog) and
 * confirms it appears in every other supported locale catalog. Any
 * missing or extra key is a hard failure.
 *
 * Usage:
 *   bun run i18n:check
 *
 * Exit codes:
 *   0 — every locale's keys match the reference catalog.
 *   1 — at least one locale is missing or has an extra key.
 *   2 — a catalog file is missing or unparsable.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export type MessageNode = unknown;

export type Problem = {
  locale: string;
  kind: 'missing' | 'extra';
  key: string;
};

export type DiffResult = {
  ok: boolean;
  problems: Problem[];
};

/**
 * Flatten a nested message object into dot-path keys, sorted. Arrays of
 * objects are walked: `steps[0].title` → `steps.0.title`. Top-level keys
 * starting with `_` are treated as catalog metadata and skipped.
 */
export function collectKeys(node: MessageNode, prefix = ''): string[] {
  const out: string[] = [];
  if (Array.isArray(node)) {
    node.forEach((entry, i) => {
      out.push(...collectKeys(entry, prefix ? `${prefix}.${i}` : String(i)));
    });
  } else if (node !== null && typeof node === 'object') {
    for (const key of Object.keys(node as Record<string, unknown>)) {
      if (!prefix && key.startsWith('_')) continue;
      const value = (node as Record<string, unknown>)[key];
      const nextPrefix = prefix ? `${prefix}.${key}` : key;
      out.push(...collectKeys(value, nextPrefix));
    }
  } else if (prefix) {
    out.push(prefix);
  }
  return out.sort();
}

export function diffMessageKeys(args: {
  reference: MessageNode;
  locales: Record<string, MessageNode>;
}): DiffResult {
  const referenceKeys = new Set(collectKeys(args.reference));
  const problems: Problem[] = [];
  for (const [locale, catalog] of Object.entries(args.locales)) {
    const localeKeys = new Set(collectKeys(catalog));
    for (const key of referenceKeys) {
      if (!localeKeys.has(key)) {
        problems.push({ locale, kind: 'missing', key });
      }
    }
    for (const key of localeKeys) {
      if (!referenceKeys.has(key)) {
        problems.push({ locale, kind: 'extra', key });
      }
    }
  }
  return { ok: problems.length === 0, problems };
}

// =====================================================================
// CLI side — only runs when invoked directly via `tsx scripts/...`.
// =====================================================================

const MESSAGES_DIR = path.resolve(process.cwd(), 'messages');
const REFERENCE_LOCALE = 'pt';
const LOCALES = ['en', 'es'] as const;

async function readCatalog(locale: string): Promise<MessageNode> {
  const file = path.join(MESSAGES_DIR, `${locale}.json`);
  try {
    const raw = await fs.readFile(file, 'utf8');
    return JSON.parse(raw) as MessageNode;
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') {
      console.error(`[i18n:check] missing catalog: ${file}`);
      process.exit(2);
    }
    console.error(`[i18n:check] failed to parse ${file}:`, err);
    process.exit(2);
  }
}

async function main(): Promise<void> {
  const reference = await readCatalog(REFERENCE_LOCALE);
  const locales: Record<string, MessageNode> = {};
  for (const locale of LOCALES) {
    locales[locale] = await readCatalog(locale);
  }
  const result = diffMessageKeys({ reference, locales });
  if (result.ok) {
    const counts = Object.fromEntries(
      Object.entries(locales).map(([loc, cat]) => [
        loc,
        collectKeys(cat).length,
      ]),
    );
    const refCount = collectKeys(reference).length;
    console.log(
      `[i18n:check] OK — ${REFERENCE_LOCALE}=${refCount} keys; ${Object.entries(
        counts,
      )
        .map(([l, n]) => `${l}=${n}`)
        .join(', ')}.`,
    );
    return;
  }
  for (const p of result.problems) {
    const verb = p.kind === 'missing' ? 'MISSING' : 'EXTRA  ';
    console.error(`[i18n:check] ${verb} ${p.locale}: ${p.key}`);
  }
  console.error(
    `[i18n:check] FAIL — ${result.problems.length} key parity violation(s).`,
  );
  process.exit(1);
}

const invokedDirectly =
  !!process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (invokedDirectly) {
  void main();
}
