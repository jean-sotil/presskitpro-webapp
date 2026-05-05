import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { EditorBundle } from '@/lib/editor/bundle';

import { HeroEditCard } from './HeroEditCard';

function makeBundle(overrides: Partial<EditorBundle> = {}): EditorBundle {
  return {
    profile: {
      id: 1,
      owner: 1,
      slug: 'mariana',
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

describe('HeroEditCard', () => {
  it('renders the hero title + all 3 hero-style options', () => {
    render(
      <HeroEditCard
        bundle={makeBundle()}
        supabaseUserId="sb-1"
        onMutate={vi.fn()}
      />,
    );
    expect(screen.getByRole('heading', { level: 2, name: /hero/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/retrato em destaque/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/lado a lado/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/logo central/i)).toBeInTheDocument();
  });

  it('fires onMutate(theme, { heroStyle }) on style change', () => {
    const onMutate = vi.fn();
    render(<HeroEditCard bundle={makeBundle()} supabaseUserId="sb-1" onMutate={onMutate} />);
    fireEvent.click(screen.getByLabelText(/lado a lado/i));
    expect(onMutate).toHaveBeenCalledWith('theme', { heroStyle: 'split-portrait-text' });
  });

  it('fires onMutate(content, { tagline }) per keystroke', () => {
    const onMutate = vi.fn();
    render(<HeroEditCard bundle={makeBundle()} supabaseUserId="sb-1" onMutate={onMutate} />);
    fireEvent.change(screen.getByLabelText(/tagline/i), {
      target: { value: 'House SP' },
    });
    expect(onMutate).toHaveBeenCalledWith('content', { tagline: 'House SP' });
  });

  it('shows the alt-required warning when a portrait is set + alt is empty', () => {
    render(
      <HeroEditCard
        bundle={makeBundle({
          profile: {
            id: 1,
            owner: 1,
            slug: 'mariana',
            status: 'draft',
            defaultLocale: 'pt-BR',
            portrait: { id: 9, bucket: 'avatars', path: 'sb-1/p.jpg' },
          },
        })}
        supabaseUserId="sb-1"
        onMutate={vi.fn()}
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(/texto alternativo é obrigatório/i);
  });

  it('flags an invalid CTA url with role=alert', () => {
    render(
      <HeroEditCard
        bundle={makeBundle({
          content: { id: 9, profile: 1, ctaUrl: 'not a url' },
        })}
        supabaseUserId="sb-1"
        onMutate={vi.fn()}
      />,
    );
    expect(screen.getAllByRole('alert')[0]).toHaveTextContent(/url precisa começar/i);
  });

  it('switches CTA preset → Custom and lets user edit ctaLabel directly', () => {
    const onMutate = vi.fn();
    render(<HeroEditCard bundle={makeBundle()} supabaseUserId="sb-1" onMutate={onMutate} />);
    fireEvent.change(screen.getByLabelText(/botão principal/i), {
      target: { value: 'custom' },
    });
    // Custom preset doesn't fire onMutate (label stays whatever the user
    // had before); it just reveals the input.
    const customs = screen
      .getAllByRole('textbox')
      .filter((el) => (el as HTMLInputElement).maxLength === 40);
    expect(customs.length).toBeGreaterThan(0);
  });

  it('preset "Book now" prefills the ctaLabel via onMutate(content, {...})', () => {
    const onMutate = vi.fn();
    render(<HeroEditCard bundle={makeBundle()} supabaseUserId="sb-1" onMutate={onMutate} />);
    fireEvent.change(screen.getByLabelText(/botão principal/i), {
      target: { value: 'book-now' },
    });
    expect(onMutate).toHaveBeenCalledWith('content', { ctaLabel: 'Book now' });
  });
});
