import { DndContext } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://abc.supabase.co');
});
afterEach(() => {
  vi.unstubAllEnvs();
});

import {
  GalleryItem,
  type GalleryEditItem,
} from './GalleryItem';

function harness(item: GalleryEditItem, props: Partial<React.ComponentProps<typeof GalleryItem>> = {}) {
  return (
    <DndContext>
      <SortableContext items={[`g-${item.id}`]} strategy={verticalListSortingStrategy}>
        <ul>
          <GalleryItem
            item={item}
            selected={false}
            altPending={false}
            onAltChange={vi.fn()}
            onDecorativeToggle={vi.fn()}
            onSelectToggle={vi.fn()}
            onRemove={vi.fn()}
            {...props}
          />
        </ul>
      </SortableContext>
    </DndContext>
  );
}

const baseItem: GalleryEditItem = {
  id: 9,
  bucket: 'gallery',
  path: 'sb-1/abc.avif',
  alt: '',
  decorative: false,
};

describe('GalleryItem', () => {
  it('shows the alt-required alert when alt is empty + not decorative', () => {
    render(harness(baseItem));
    expect(screen.getByRole('alert')).toHaveTextContent(/alt obrigatório/i);
  });

  it('hides the alert when decorative=true (alt empty is OK)', () => {
    render(harness({ ...baseItem, decorative: true }));
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('disables the alt input when decorative=true', () => {
    render(harness({ ...baseItem, decorative: true }));
    expect(screen.getByPlaceholderText(/decorativa/i)).toBeDisabled();
  });

  it('fires onAltChange + onDecorativeToggle + onSelectToggle + onRemove', () => {
    const onAltChange = vi.fn();
    const onDecorativeToggle = vi.fn();
    const onSelectToggle = vi.fn();
    const onRemove = vi.fn();
    render(
      harness(baseItem, {
        onAltChange,
        onDecorativeToggle,
        onSelectToggle,
        onRemove,
      }),
    );
    fireEvent.change(screen.getByPlaceholderText(/descreva a imagem/i), {
      target: { value: 'Show no Maraná' },
    });
    expect(onAltChange).toHaveBeenCalledWith('Show no Maraná');

    fireEvent.click(screen.getByRole('checkbox', { name: /decorativa/i }));
    expect(onDecorativeToggle).toHaveBeenCalledWith(true);

    fireEvent.click(screen.getByLabelText(/selecionar imagem 9/i));
    expect(onSelectToggle).toHaveBeenCalledWith(true);

    fireEvent.click(screen.getByLabelText(/remover imagem 9/i));
    expect(onRemove).toHaveBeenCalled();
  });

  it('renders the image with empty alt when decorative=true (WCAG-correct, role=presentation)', () => {
    const { container } = render(harness({ ...baseItem, decorative: true, alt: 'leftover alt' }));
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img!.getAttribute('alt')).toBe('');
    // RTL's getByRole('img') should NOT match — empty alt → role=presentation.
    expect(screen.queryByRole('img')).toBeNull();
  });
});
