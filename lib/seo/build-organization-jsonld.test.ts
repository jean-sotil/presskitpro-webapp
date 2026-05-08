import { describe, expect, it } from 'vitest';

import { buildOrganizationJsonLd } from './build-organization-jsonld';

describe('buildOrganizationJsonLd', () => {
  it('emits the schema.org context + Organization type with brand name', () => {
    const ld = buildOrganizationJsonLd({ origin: 'https://presskit.pro' });
    expect(ld['@context']).toBe('https://schema.org');
    expect(ld['@type']).toBe('Organization');
    expect(ld.name).toBe('PressKit Pro');
  });

  it('uses the cleaned origin as the url and resolves the logo against it', () => {
    const ld = buildOrganizationJsonLd({ origin: 'https://presskit.pro/' });
    expect(ld.url).toBe('https://presskit.pro');
    expect(ld.logo).toBe('https://presskit.pro/og-image.png');
  });

  it('honors a custom logoPath', () => {
    const ld = buildOrganizationJsonLd({
      origin: 'https://presskit.pro',
      logoPath: '/brand/logo.png',
    });
    expect(ld.logo).toBe('https://presskit.pro/brand/logo.png');
  });

  it('only includes sameAs when at least one URL is provided', () => {
    const ld = buildOrganizationJsonLd({ origin: 'https://presskit.pro' });
    expect(ld.sameAs).toBeUndefined();
    const ld2 = buildOrganizationJsonLd({
      origin: 'https://presskit.pro',
      sameAs: ['https://www.instagram.com/presskitpro'],
    });
    expect(ld2.sameAs).toEqual(['https://www.instagram.com/presskitpro']);
  });
});
