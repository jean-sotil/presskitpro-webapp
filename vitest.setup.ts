import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

import enMessages from './messages/en.json';

afterEach(() => {
  cleanup();
});

/**
 * Resolve a dot-path key against the EN catalog, then substitute ICU-
 * style `{name}` placeholders with values from the call. Returns the
 * literal key when the path doesn't resolve so missing keys are loud
 * but not fatal in unit tests.
 */
function translate(
  catalog: unknown,
  namespace: string | undefined,
  key: string,
  values?: Record<string, unknown>,
): string {
  const fullPath = namespace ? `${namespace}.${key}` : key;
  const segments = fullPath.split('.');
  let node: unknown = catalog;
  for (const segment of segments) {
    if (node && typeof node === 'object' && segment in (node as object)) {
      node = (node as Record<string, unknown>)[segment];
    } else {
      return fullPath;
    }
  }
  let msg = typeof node === 'string' ? node : fullPath;
  if (values) {
    for (const [k, v] of Object.entries(values)) {
      msg = msg.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return msg;
}

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(async (namespace?: string) => {
    return (key: string, values?: Record<string, unknown>) =>
      translate(enMessages, namespace, key, values);
  }),
  getLocale: vi.fn(async () => 'en'),
  getMessages: vi.fn(async () => enMessages),
}));

/**
 * Resolve a dot-path key against the EN catalog and return the raw
 * value (string, array, or object). Mirrors next-intl's `t.raw`. Used
 * for components that render arrays via `t.raw('items')`.
 */
function rawTranslate(
  catalog: unknown,
  namespace: string | undefined,
  key: string,
): unknown {
  const fullPath = namespace ? `${namespace}.${key}` : key;
  const segments = fullPath.split('.');
  let node: unknown = catalog;
  for (const segment of segments) {
    if (node && typeof node === 'object' && segment in (node as object)) {
      node = (node as Record<string, unknown>)[segment];
    } else {
      return fullPath;
    }
  }
  return node;
}

vi.mock('next-intl', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    useTranslations: vi.fn((namespace?: string) => {
      // The next-intl `t` is callable AND has a `.raw` method. Mirror
      // both so components can use either form in tests.
      const fn = (key: string, values?: Record<string, unknown>) =>
        translate(enMessages, namespace, key, values);
      (fn as unknown as { raw: (k: string) => unknown }).raw = (key: string) =>
        rawTranslate(enMessages, namespace, key);
      return fn;
    }),
    useLocale: vi.fn(() => 'en'),
  };
});
