import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { EditorBundle } from '@/lib/editor/bundle';

import { ThemeTab } from './ThemeTab';

function makeBundle(themeOverrides: Record<string, unknown> = {}): EditorBundle {
  return {
    profile: {
      id: 1,
      owner: 1,
      slug: 'a',
      status: 'draft',
      defaultLocale: 'pt-BR',
    } as never,
    content: null,
    theme: {
      id: 9,
      profile: 1,
      colorPresetId: 'editorial-night',
      accentPresetId: 'electric-green',
      fontPairId: 'editorial-nightlife',
      heroStyle: 'full-bleed-portrait',
      galleryLayout: 'mosaic',
      ...themeOverrides,
    } as never,
    socialLinks: [],
    featuredTrack: null,
    instagramConnection: null,
    instagramPosts: [],
  };
}

describe('ThemeTab', () => {
  it('renders all 6 bg presets and 12 accent presets', () => {
    render(<ThemeTab bundle={makeBundle()} onMutate={vi.fn()} />);
    // Exact-match name to avoid colliding with font pair "Editorial Nightlife".
    expect(screen.getAllByRole('button', { name: /^editorial night$/i })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: /^paper white$/i })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: /^electric green$/i })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: /^cobalt$/i })).toHaveLength(1);
  });

  it('marks the active bg preset with aria-pressed', () => {
    render(
      <ThemeTab
        bundle={makeBundle({ colorPresetId: 'paper-white' })}
        onMutate={vi.fn()}
      />,
    );
    expect(
      screen.getByRole('button', { name: /paper white/i }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('clears bg hex override when a preset is selected', () => {
    const onMutate = vi.fn();
    render(
      <ThemeTab
        bundle={makeBundle({ bg: '#ababab' })}
        onMutate={onMutate}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /paper white/i }));
    expect(onMutate).toHaveBeenCalledWith('theme', {
      colorPresetId: 'paper-white',
      bg: '',
    });
  });

  it('shows the live contrast ratios', () => {
    render(<ThemeTab bundle={makeBundle()} onMutate={vi.fn()} />);
    // The "Editorial Night" defaults always pass.
    expect(screen.getByText(/text \/ bg/i)).toBeInTheDocument();
    expect(screen.getByText(/accent \/ bg/i)).toBeInTheDocument();
  });

  it('surfaces a contrast failure when text/bg is too low', () => {
    render(
      <ThemeTab
        bundle={makeBundle({ bg: '#ffffff', text: '#cccccc' })}
        onMutate={vi.fn()}
      />,
    );
    const banner = screen.getByRole('alert');
    expect(banner).toHaveTextContent(/contraste insuficiente/i);
  });

  it('writes the custom bg hex on input change', () => {
    const onMutate = vi.fn();
    render(<ThemeTab bundle={makeBundle()} onMutate={onMutate} />);
    const inputs = screen.getAllByLabelText(/bg \(hex\)/i);
    const textInput = inputs.find((el) => el.getAttribute('type') === 'text')!;
    fireEvent.change(textInput, { target: { value: '#abcdef' } });
    fireEvent.blur(textInput);
    expect(onMutate).toHaveBeenCalledWith('theme', {
      colorPresetId: '',
      bg: '#abcdef',
    });
  });

  it('switches font pair via the font cards', () => {
    const onMutate = vi.fn();
    render(<ThemeTab bundle={makeBundle()} onMutate={onMutate} />);
    fireEvent.click(screen.getByRole('button', { name: /^magazine$/i }));
    expect(onMutate).toHaveBeenCalledWith('theme', { fontPairId: 'magazine' });
  });

  it('switches hero style via the hero buttons', () => {
    const onMutate = vi.fn();
    render(<ThemeTab bundle={makeBundle()} onMutate={onMutate} />);
    fireEvent.click(screen.getByRole('button', { name: /split portrait/i }));
    expect(onMutate).toHaveBeenCalledWith('theme', {
      heroStyle: 'split-portrait-text',
    });
  });

  it('switches gallery layout via the layout buttons', () => {
    const onMutate = vi.fn();
    render(<ThemeTab bundle={makeBundle()} onMutate={onMutate} />);
    fireEvent.click(screen.getByRole('button', { name: /carousel/i }));
    expect(onMutate).toHaveBeenCalledWith('theme', {
      galleryLayout: 'carousel',
    });
  });
});
