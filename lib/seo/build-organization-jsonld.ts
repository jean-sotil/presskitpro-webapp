/**
 * Pure builder for the site-wide `Organization` JSON-LD payload.
 *
 * Emitted from the root layout so every crawl entrypoint gets the
 * brand record. Helps Google build the brand panel + sitelinks search
 * box. Profile pages still emit their own `MusicGroup` JSON-LD via
 * `buildProfileJsonLd` — the two coexist because they describe
 * different entities (the SaaS vs the artist).
 */

export interface OrganizationJsonLd {
  '@context': 'https://schema.org';
  '@type': 'Organization';
  name: string;
  url: string;
  logo: string;
  sameAs?: string[];
}

export interface BuildOrganizationJsonLdInput {
  origin: string;
  /** Public path to the brand mark used as the `logo` field. Defaults
   *  to `/og-image.png` so we don't ship a second asset until the
   *  brand team supplies a dedicated square logo. */
  logoPath?: string;
  sameAs?: string[];
}

export function buildOrganizationJsonLd(
  input: BuildOrganizationJsonLdInput,
): OrganizationJsonLd {
  const cleanOrigin = input.origin.replace(/\/$/, '');
  const logoPath = input.logoPath ?? '/og-image.png';
  const ld: OrganizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'PressKit Pro',
    url: cleanOrigin,
    logo: `${cleanOrigin}${logoPath}`,
  };
  if (input.sameAs && input.sameAs.length > 0) {
    ld.sameAs = input.sameAs;
  }
  return ld;
}
