import { describe, expect, it } from 'vitest';

import {
  DEFAULT_SECTION_ORDER,
  mergeOrder,
  reorderSection,
  type SectionKey,
} from './section-order';

describe('mergeOrder', () => {
  it('returns the registry default when no persisted order exists', () => {
    expect(mergeOrder([])).toEqual(DEFAULT_SECTION_ORDER);
    expect(mergeOrder(null)).toEqual(DEFAULT_SECTION_ORDER);
    expect(mergeOrder(undefined)).toEqual(DEFAULT_SECTION_ORDER);
  });

  it('keeps the persisted order verbatim when it covers every registered key', () => {
    const persisted: SectionKey[] = [
      'contact', 'socialLinks', 'pressKitLink', 'photoGallery',
      'instagramFeed', 'featuredTrack', 'services', 'about', 'hero',
    ];
    expect(mergeOrder(persisted)).toEqual(persisted);
  });

  it('appends missing registry keys to the end of a partial persisted order', () => {
    const result = mergeOrder(['hero', 'about']);
    expect(result.slice(0, 2)).toEqual(['hero', 'about']);
    expect(result.length).toBe(DEFAULT_SECTION_ORDER.length);
    // Every default key is present exactly once.
    for (const key of DEFAULT_SECTION_ORDER) {
      expect(result.filter((k) => k === key)).toHaveLength(1);
    }
  });

  it('drops persisted keys that are no longer in the registry (renamed/removed)', () => {
    const result = mergeOrder([
      'hero',
      'ghost-section' as SectionKey,
      'about',
    ]);
    expect(result).not.toContain('ghost-section');
    expect(result).toContain('hero');
    expect(result).toContain('about');
  });

  it('de-duplicates persisted entries (corrupted state recovery)', () => {
    const result = mergeOrder(['hero', 'hero', 'about']);
    expect(result.filter((k) => k === 'hero')).toHaveLength(1);
  });
});

describe('reorderSection', () => {
  const order: SectionKey[] = ['hero', 'about', 'services', 'contact'];

  it('moves a section up', () => {
    expect(reorderSection(order, 'services', 'hero')).toEqual([
      'services', 'hero', 'about', 'contact',
    ]);
  });

  it('moves a section down', () => {
    expect(reorderSection(order, 'about', 'contact')).toEqual([
      'hero', 'services', 'contact', 'about',
    ]);
  });

  it('is a no-op when from and to are equal', () => {
    expect(reorderSection(order, 'about', 'about')).toEqual(order);
  });

  it('returns the original order when the from key does not exist', () => {
    expect(reorderSection(order, 'ghost' as SectionKey, 'about')).toEqual(order);
  });

  it('returns the original order when the to key does not exist', () => {
    expect(reorderSection(order, 'about', 'ghost' as SectionKey)).toEqual(order);
  });
});
