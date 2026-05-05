import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ProfileRenderer } from './ProfileRenderer';
import type { EditorBundle } from '@/lib/editor/bundle';

function makeBundle(overrides: Partial<EditorBundle> = {}): EditorBundle {
  return {
    profile: {
      id: 1,
      owner: 1,
      slug: 'mariana-luz',
      status: 'draft',
      defaultLocale: 'pt-BR',
    },
    content: null,
    theme: null,
    socialLinks: [],
    featuredTrack: null,
    instagramConnection: null,
    ...overrides,
  };
}

describe('ProfileRenderer', () => {
  it('renders the hero from slug alone (other sections silent without data)', () => {
    render(<ProfileRenderer bundle={makeBundle()} mode="preview" />);
    expect(
      screen.getByRole('heading', { level: 1, name: /mariana luz/i }),
    ).toBeInTheDocument();
    // Other sections shouldn't surface H2s when data is missing.
    expect(screen.queryByRole('heading', { level: 2 })).toBeNull();
  });

  it('renders services when present', () => {
    render(
      <ProfileRenderer
        mode="preview"
        bundle={makeBundle({
          content: {
            id: 9,
            profile: 1,
            services: [{ title: 'DJ Set', description: '60 min' }],
          },
        })}
      />,
    );
    expect(screen.getByRole('heading', { level: 2, name: /serviços/i })).toBeInTheDocument();
    expect(screen.getByText('DJ Set')).toBeInTheDocument();
  });

  it('respects a custom Themes.sectionOrder', () => {
    const { container } = render(
      <ProfileRenderer
        mode="preview"
        bundle={makeBundle({
          profile: {
            id: 1,
            owner: 1,
            slug: 'mariana-luz',
            status: 'draft',
            defaultLocale: 'pt-BR',
            contactEmail: 'press@x.com',
          },
          theme: {
            id: 2,
            profile: 1,
            sectionOrder: [
              { key: 'contact' },
              { key: 'hero' },
            ],
          },
          content: { id: 9, profile: 1, tagline: 'House' },
        })}
      />,
    );
    const headings = container.querySelectorAll('h1, h2');
    // Contact h2 comes BEFORE the hero h1 in DOM order.
    const order = Array.from(headings).map((h) => h.tagName);
    expect(order[0]).toBe('H2');
    expect(order[1]).toBe('H1');
  });

  it('falls back to default order when theme.sectionOrder is missing', () => {
    render(
      <ProfileRenderer
        mode="preview"
        bundle={makeBundle({
          content: { id: 9, profile: 1, tagline: 'House' },
        })}
      />,
    );
    expect(
      screen.getByRole('heading', { level: 1, name: /mariana luz/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /sobre/i })).toBeInTheDocument();
  });
});
