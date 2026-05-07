import { describe, expect, it } from 'vitest';

import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  fromPayloadLocale,
  isSupportedLocale,
  negotiateLocale,
  toBcp47,
  toPayloadLocale,
} from './locale';

describe('SUPPORTED_LOCALES', () => {
  it('lists pt, en, es (Portuguese is first / the default)', () => {
    expect(SUPPORTED_LOCALES).toEqual(['pt', 'en', 'es']);
    expect(DEFAULT_LOCALE).toBe('pt');
  });
});

describe('isSupportedLocale', () => {
  it.each(['pt', 'en', 'es'])('accepts %s', (l) => {
    expect(isSupportedLocale(l)).toBe(true);
  });
  it.each(['fr', 'de', '', 'PT', 'pt-BR', undefined, null])('rejects %s', (l) => {
    expect(isSupportedLocale(l as string)).toBe(false);
  });
});

describe('negotiateLocale', () => {
  it('cookie wins when it names a supported locale', () => {
    const r = negotiateLocale({
      cookie: 'es',
      acceptLanguage: 'en-US,en;q=0.9',
    });
    expect(r).toBe('es');
  });

  it('ignores an unsupported cookie value', () => {
    const r = negotiateLocale({
      cookie: 'fr',
      acceptLanguage: 'en-US,en;q=0.9',
    });
    expect(r).toBe('en');
  });

  it('falls back to Accept-Language when cookie is empty', () => {
    expect(
      negotiateLocale({ cookie: undefined, acceptLanguage: 'es-ES,es;q=0.9' }),
    ).toBe('es');
    expect(
      negotiateLocale({ cookie: '', acceptLanguage: 'pt-BR,pt;q=0.9' }),
    ).toBe('pt');
  });

  it('honors the highest-quality supported language in Accept-Language', () => {
    const r = negotiateLocale({
      cookie: undefined,
      acceptLanguage: 'fr;q=1.0,en;q=0.9,es;q=0.5',
    });
    expect(r).toBe('en');
  });

  it('matches BCP-47 dialects to their base language', () => {
    expect(
      negotiateLocale({ cookie: undefined, acceptLanguage: 'pt-PT' }),
    ).toBe('pt');
    expect(
      negotiateLocale({ cookie: undefined, acceptLanguage: 'es-MX,es-AR' }),
    ).toBe('es');
  });

  it('falls back to the default locale when nothing matches', () => {
    expect(
      negotiateLocale({ cookie: undefined, acceptLanguage: 'fr-FR,de;q=0.5' }),
    ).toBe('pt');
    expect(
      negotiateLocale({ cookie: undefined, acceptLanguage: undefined }),
    ).toBe('pt');
  });
});

describe('toBcp47', () => {
  it('maps short locale codes to BCP-47 tags for <html lang>', () => {
    expect(toBcp47('pt')).toBe('pt-BR');
    expect(toBcp47('en')).toBe('en');
    expect(toBcp47('es')).toBe('es');
  });
});

describe('toPayloadLocale / fromPayloadLocale', () => {
  it('round-trips between short code and Payload locale', () => {
    for (const short of ['pt', 'en', 'es'] as const) {
      expect(fromPayloadLocale(toPayloadLocale(short))).toBe(short);
    }
  });

  it('returns null for unknown Payload locales', () => {
    expect(fromPayloadLocale('fr')).toBeNull();
    expect(fromPayloadLocale('en-GB')).toBeNull();
    expect(fromPayloadLocale('')).toBeNull();
  });
});
