import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DEFAULT_SECTION_ORDER, type SectionKey } from '@/lib/editor/section-order';
import { SectionRail } from './SectionRail';

const labels: Record<SectionKey, string> = {
  hero: 'Hero',
  about: 'Sobre',
  services: 'Serviços',
  featuredTrack: 'Faixa',
  instagramFeed: 'Instagram',
  photoGallery: 'Galeria',
  pressKitLink: 'Press kit',
  socialLinks: 'Redes',
  contact: 'Contato',
};

describe('SectionRail', () => {
  it('renders one button per section + a reorder handle each', () => {
    render(
      <SectionRail
        order={[...DEFAULT_SECTION_ORDER]}
        active="hero"
        labels={labels}
        onSelect={vi.fn()}
        onReorder={vi.fn()}
      />,
    );
    // 9 select buttons + 9 reorder handles = 18 buttons.
    expect(screen.getAllByRole('button').length).toBe(18);
    expect(screen.getByRole('button', { name: 'Hero' })).toHaveAttribute(
      'aria-current',
      'true',
    );
  });

  it('fires onSelect with the clicked key', () => {
    const onSelect = vi.fn();
    render(
      <SectionRail
        order={[...DEFAULT_SECTION_ORDER]}
        active="hero"
        labels={labels}
        onSelect={onSelect}
        onReorder={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Sobre' }));
    expect(onSelect).toHaveBeenCalledWith('about');
  });

  it('exposes each item via aria-label so screen-readers can target the drag handle', () => {
    render(
      <SectionRail
        order={[...DEFAULT_SECTION_ORDER]}
        active="hero"
        labels={labels}
        onSelect={vi.fn()}
        onReorder={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('Reordenar Hero')).toBeInTheDocument();
    expect(screen.getByLabelText('Reordenar Contato')).toBeInTheDocument();
  });
});
