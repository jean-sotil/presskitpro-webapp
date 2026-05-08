import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { EditorBundle } from '@/lib/editor/bundle';

import { Marquee } from './Marquee';

function makeBundle(slug = 'hayakawa', tagline?: string): EditorBundle {
  return {
    profile: {
      id: 1,
      owner: 1,
      slug,
      status: 'draft',
      defaultLocale: 'pt-BR',
    } as never,
    content: tagline ? ({ tagline } as never) : null,
    theme: null,
    socialLinks: [],
    featuredTrack: null,
    instagramConnection: null,
    instagramPosts: [],
  };
}

describe('Marquee', () => {
  it('renders an aria-hidden ticker with the humanized slug repeated', () => {
    render(<Marquee bundle={makeBundle('dj-hayakawa')} source="displayName" />);
    const aside = screen.getByRole('complementary', { hidden: true });
    expect(aside).toHaveAttribute('aria-hidden', 'true');
    expect(aside.textContent).toContain('dj hayakawa');
    const occurrences = (aside.textContent ?? '').split('dj hayakawa').length - 1;
    expect(occurrences).toBeGreaterThanOrEqual(8);
  });

  it('renders the tagline when source=tagline', () => {
    render(
      <Marquee
        bundle={makeBundle('hayakawa', 'eletro brutalista')}
        source="tagline"
      />,
    );
    // Track is duplicated 2x for seamless looping, so the tagline
    // appears 2 × repeat times — just assert presence.
    expect(screen.getAllByText(/eletro brutalista/).length).toBeGreaterThan(0);
  });

  it('returns null when the source field is empty', () => {
    const { container } = render(
      <Marquee bundle={makeBundle('hayakawa')} source="tagline" />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
