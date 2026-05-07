import { describe, expect, it } from 'vitest';

import { collectKeys, diffMessageKeys } from './check-i18n-keys';

describe('collectKeys', () => {
  it('flattens nested objects into dot-paths', () => {
    expect(
      collectKeys({
        hero: { title: 'a', cta: 'b' },
        footer: { copyright: 'c' },
      }),
    ).toEqual(['hero.title', 'hero.cta', 'footer.copyright'].sort());
  });

  it('treats arrays of objects as a list of fields per index', () => {
    expect(
      collectKeys({
        howItWorks: {
          steps: [
            { n: '01', title: 'a' },
            { n: '02', title: 'b' },
          ],
        },
      }),
    ).toEqual(
      ['howItWorks.steps.0.n', 'howItWorks.steps.0.title', 'howItWorks.steps.1.n', 'howItWorks.steps.1.title'].sort(),
    );
  });

  it('skips keys whose names start with an underscore (catalog metadata)', () => {
    expect(
      collectKeys({
        _meta: { locale: 'pt', draft: false },
        hero: { title: 'a' },
      }),
    ).toEqual(['hero.title']);
  });
});

describe('diffMessageKeys', () => {
  const reference: Record<string, unknown> = {
    hero: { title: 'a', cta: 'b' },
    footer: { copyright: 'c' },
  };

  it('returns no missing/extra keys when locales match', () => {
    const r = diffMessageKeys({
      reference,
      locales: { en: reference, es: reference },
    });
    expect(r.ok).toBe(true);
    expect(r.problems).toEqual([]);
  });

  it('reports missing keys per locale', () => {
    const r = diffMessageKeys({
      reference,
      locales: {
        en: { hero: { title: 'a' } }, // missing hero.cta and footer.copyright
        es: reference,
      },
    });
    expect(r.ok).toBe(false);
    expect(r.problems).toContainEqual({
      locale: 'en',
      kind: 'missing',
      key: 'hero.cta',
    });
    expect(r.problems).toContainEqual({
      locale: 'en',
      kind: 'missing',
      key: 'footer.copyright',
    });
  });

  it('reports extra keys (likely typos in non-reference locales)', () => {
    const r = diffMessageKeys({
      reference,
      locales: {
        en: { ...reference, footer: { copyright: 'c', extraKey: 'oops' } },
        es: reference,
      },
    });
    expect(r.ok).toBe(false);
    expect(r.problems).toContainEqual({
      locale: 'en',
      kind: 'extra',
      key: 'footer.extraKey',
    });
  });
});
