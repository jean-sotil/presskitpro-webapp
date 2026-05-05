import { describe, expect, it } from 'vitest';

import {
  GALLERY_HARD_CAP,
  GALLERY_SOFT_CAP,
  type GalleryItem,
  validateGallery,
} from './gallery-validate';

describe('validateGallery', () => {
  it('accepts an empty gallery', () => {
    expect(validateGallery([])).toEqual({ ok: true });
  });

  it('accepts items with non-empty alt', () => {
    const items: GalleryItem[] = [
      { id: 1, alt: 'DJ at Warung', decorative: false },
      { id: 2, alt: 'Berlin gig', decorative: false },
    ];
    expect(validateGallery(items)).toEqual({ ok: true });
  });

  it('accepts items with decorative=true even if alt is empty', () => {
    const items: GalleryItem[] = [
      { id: 1, alt: '', decorative: true },
      { id: 2, alt: 'Real photo', decorative: false },
    ];
    expect(validateGallery(items)).toEqual({ ok: true });
  });

  it('reports indices of items missing alt + not decorative', () => {
    const items: GalleryItem[] = [
      { id: 1, alt: 'OK', decorative: false },
      { id: 2, alt: '', decorative: false },
      { id: 3, alt: '   ', decorative: false },
      { id: 4, alt: 'OK 2', decorative: false },
    ];
    expect(validateGallery(items)).toMatchObject({
      ok: false,
      reason: 'missing-alt',
      indices: [1, 2],
    });
  });

  it(`rejects more than ${GALLERY_HARD_CAP} items`, () => {
    const items: GalleryItem[] = Array.from({ length: GALLERY_HARD_CAP + 1 }, (_, i) => ({
      id: i,
      alt: 'OK',
      decorative: false,
    }));
    expect(validateGallery(items)).toEqual({ ok: false, reason: 'too-many' });
  });

  it(`accepts exactly ${GALLERY_HARD_CAP} items (with soft-cap warning since 50 > 24)`, () => {
    const items: GalleryItem[] = Array.from({ length: GALLERY_HARD_CAP }, (_, i) => ({
      id: i,
      alt: 'OK',
      decorative: false,
    }));
    expect(validateGallery(items)).toEqual({ ok: true, warning: 'soft-cap' });
  });

  it(`emits a soft-cap warning above ${GALLERY_SOFT_CAP} items (non-blocking)`, () => {
    const items: GalleryItem[] = Array.from({ length: GALLERY_SOFT_CAP + 1 }, (_, i) => ({
      id: i,
      alt: 'OK',
      decorative: false,
    }));
    expect(validateGallery(items)).toEqual({ ok: true, warning: 'soft-cap' });
  });
});
