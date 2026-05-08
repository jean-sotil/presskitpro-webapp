import { describe, expect, it } from 'vitest';

import { buildMarketingMetadata } from './build-marketing-metadata';

const ORIGIN = 'https://presskit.pro';

describe('buildMarketingMetadata', () => {
  it('emits canonical URL composed from origin + path', () => {
    const meta = buildMarketingMetadata({
      origin: ORIGIN,
      path: '/privacy',
      locale: 'pt',
      title: 'Política de Privacidade',
      description: 'lgpd.',
    });
    expect(meta.alternates?.canonical).toBe('https://presskit.pro/privacy');
  });

  it('strips a trailing slash from the origin before composing the URL', () => {
    const meta = buildMarketingMetadata({
      origin: 'https://presskit.pro/',
      path: '/privacy',
      locale: 'pt',
      title: 'a',
      description: 'b',
    });
    expect(meta.alternates?.canonical).toBe('https://presskit.pro/privacy');
  });

  it('lists every supported locale under alternates.languages with x-default', () => {
    const meta = buildMarketingMetadata({
      origin: ORIGIN,
      path: '/',
      locale: 'pt',
      title: 'a',
      description: 'b',
    });
    const languages = meta.alternates?.languages as Record<string, string>;
    expect(languages['pt-BR']).toBe('https://presskit.pro/');
    expect(languages['en']).toBe('https://presskit.pro/');
    expect(languages['es']).toBe('https://presskit.pro/');
    expect(languages['x-default']).toBe('https://presskit.pro/');
  });

  it('puts the active locale on og:locale and the others on og:locale:alternate', () => {
    const meta = buildMarketingMetadata({
      origin: ORIGIN,
      path: '/',
      locale: 'en',
      title: 'a',
      description: 'b',
    });
    expect(meta.openGraph?.locale).toBe('en_US');
    const og = meta.openGraph as { alternateLocale?: string[] };
    expect(og.alternateLocale).toContain('pt_BR');
    expect(og.alternateLocale).toContain('es_ES');
    expect(og.alternateLocale).not.toContain('en_US');
  });

  it('brands OG and Twitter titles, leaves the bare title for the page <title> template', () => {
    const meta = buildMarketingMetadata({
      origin: ORIGIN,
      path: '/',
      locale: 'pt',
      title: 'Press kits em 5 minutos',
      description: 'b',
    });
    expect(meta.title).toBe('Press kits em 5 minutos');
    expect(meta.openGraph?.title).toBe('Press kits em 5 minutos | PressKit Pro');
    expect(meta.twitter?.title).toBe('Press kits em 5 minutos | PressKit Pro');
  });

  it('uses /og-image.png as the default image and resolves it against origin', () => {
    const meta = buildMarketingMetadata({
      origin: ORIGIN,
      path: '/',
      locale: 'pt',
      title: 'a',
      description: 'b',
    });
    const og = meta.openGraph as { images?: Array<{ url: string }> };
    expect(og.images?.[0]?.url).toBe('https://presskit.pro/og-image.png');
  });

  it('passes through an absolute imagePath unchanged', () => {
    const meta = buildMarketingMetadata({
      origin: ORIGIN,
      path: '/',
      locale: 'pt',
      title: 'a',
      description: 'b',
      imagePath: 'https://cdn.example.com/og.png',
    });
    const og = meta.openGraph as { images?: Array<{ url: string }> };
    expect(og.images?.[0]?.url).toBe('https://cdn.example.com/og.png');
  });

  it('sets twitter card to summary_large_image', () => {
    const meta = buildMarketingMetadata({
      origin: ORIGIN,
      path: '/',
      locale: 'pt',
      title: 'a',
      description: 'b',
    });
    const tw = meta.twitter as { card?: string };
    expect(tw.card).toBe('summary_large_image');
  });
});
