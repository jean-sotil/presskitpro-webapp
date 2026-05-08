import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { GalleryLightbox, type LightboxItem } from './GalleryLightbox';

const items: LightboxItem[] = [
  { id: 1, src: 'https://example.com/a.jpg', alt: 'First photo' },
  { id: 2, src: 'https://example.com/b.jpg', alt: 'Second photo' },
  { id: 3, src: 'https://example.com/c.jpg', alt: 'Third photo' },
];

afterEach(() => {
  // Reset body overflow that the lightbox lock may have set; otherwise
  // a failing test can leak `overflow:hidden` into the next one.
  document.body.style.overflow = '';
});

function setup(initial: LightboxItem[] = items) {
  return render(
    <GalleryLightbox
      items={initial}
      gridClassName="grid grid-cols-2"
      tileClassName={() => 'aspect-square'}
    />,
  );
}

describe('GalleryLightbox', () => {
  it('renders one accessible button per item', () => {
    setup();
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);
    expect(buttons[0]).toHaveAttribute(
      'aria-label',
      'Open photo 1 of 3: First photo',
    );
  });

  it('opens the modal when a tile is clicked', () => {
    setup();
    fireEvent.click(screen.getAllByRole('button')[1]!);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-label', 'Photo viewer: Second photo');
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });

  it('locks body scroll while open', () => {
    setup();
    fireEvent.click(screen.getAllByRole('button')[0]!);
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('closes on ESC and restores body scroll', () => {
    setup();
    fireEvent.click(screen.getAllByRole('button')[0]!);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.body.style.overflow).toBe('');
  });

  it('cycles forward with ArrowRight and wraps past the end', () => {
    setup();
    fireEvent.click(screen.getAllByRole('button')[2]!);
    expect(screen.getByText('3 / 3')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('cycles backward with ArrowLeft and wraps before the start', () => {
    setup();
    fireEvent.click(screen.getAllByRole('button')[0]!);
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'ArrowLeft' });
    expect(screen.getByText('3 / 3')).toBeInTheDocument();
  });

  it('closes when the backdrop button is clicked', () => {
    setup();
    fireEvent.click(screen.getAllByRole('button')[0]!);
    // Inside the open dialog, the first button is the absolute-positioned
    // backdrop dismiss target (tabIndex -1, fills the dialog).
    const dialog = screen.getByRole('dialog');
    const backdrop = dialog.querySelector('button')!;
    fireEvent.click(backdrop);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('keeps the modal open when the figure (image area) is clicked', () => {
    const { container } = setup();
    fireEvent.click(screen.getAllByRole('button')[0]!);
    const figure = container.ownerDocument.querySelector('figure');
    expect(figure).not.toBeNull();
    fireEvent.click(figure!);
    expect(screen.queryByRole('dialog')).not.toBeNull();
  });
});
