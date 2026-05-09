import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/components/editor/rich-text/BioEditor', () => ({
  BioEditor: ({ ariaLabel }: { ariaLabel?: string }) => (
    <div data-testid="bio-editor" aria-label={ariaLabel} />
  ),
}));

import type { EditorBundle } from '@/lib/editor/bundle';

import { AboutEditCard } from './AboutEditCard';

function makeBundle(overrides: Partial<EditorBundle> = {}): EditorBundle {
  return {
    profile: { id: 1, owner: 1, slug: 'a', status: 'draft', defaultLocale: 'pt-BR' },
    content: null,
    theme: null,
    socialLinks: [],
    featuredTrack: null,
    instagramConnection: null,
    instagramPosts: [],
    ...overrides,
  };
}

describe('AboutEditCard', () => {
  it('shows the empty-state prompts when bio is empty', () => {
    // Test setup mocks `useTranslations` to read en.json — assert against
    // the EN strings in messages/en.json under `editor.cards.about`.
    render(<AboutEditCard bundle={makeBundle()} onMutate={vi.fn()} />);
    expect(screen.getByText(/not sure where to start/i)).toBeInTheDocument();
    expect(screen.getByText(/how do you describe/i)).toBeInTheDocument();
  });

  it('hides the prompts when bio has content', () => {
    const bio = {
      root: {
        children: [
          { type: 'paragraph', children: [{ type: 'text', text: 'já tinha bio' }] },
        ],
      },
    };
    render(
      <AboutEditCard
        bundle={makeBundle({ content: { id: 9, profile: 1, bio } as never })}
        onMutate={vi.fn()}
      />,
    );
    expect(screen.queryByText(/not sure where to start/i)).toBeNull();
  });

  it('always renders the BioEditor', () => {
    render(<AboutEditCard bundle={makeBundle()} onMutate={vi.fn()} />);
    expect(screen.getByTestId('bio-editor')).toBeInTheDocument();
  });
});
