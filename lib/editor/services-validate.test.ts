import { describe, expect, it } from 'vitest';

import {
  MAX_SERVICES,
  type ServiceItem,
  validateServiceItem,
  validateServicesArray,
} from './services-validate';

describe('validateServiceItem', () => {
  it('rejects empty title', () => {
    expect(validateServiceItem({ title: '', description: '' })).toEqual({
      ok: false,
      reason: 'title-required',
    });
    expect(validateServiceItem({ title: '   ', description: '' })).toEqual({
      ok: false,
      reason: 'title-required',
    });
  });

  it('rejects title > 80 chars (matches schema maxLength)', () => {
    expect(validateServiceItem({ title: 'a'.repeat(81), description: '' })).toEqual({
      ok: false,
      reason: 'title-too-long',
    });
  });

  it('rejects description > 240 chars', () => {
    expect(
      validateServiceItem({ title: 'DJ Set', description: 'a'.repeat(241) }),
    ).toEqual({ ok: false, reason: 'description-too-long' });
  });

  it('accepts a valid item', () => {
    expect(validateServiceItem({ title: 'DJ Set', description: '60 min sessions' })).toEqual({ ok: true });
  });

  it('accepts a missing description (optional field)', () => {
    expect(validateServiceItem({ title: 'DJ Set' } as ServiceItem)).toEqual({ ok: true });
  });
});

describe('validateServicesArray', () => {
  it('accepts up to MAX_SERVICES items', () => {
    const items = Array.from({ length: MAX_SERVICES }, (_, i) => ({
      title: `Service ${i + 1}`,
    })) as ServiceItem[];
    expect(validateServicesArray(items)).toEqual({ ok: true });
  });

  it('rejects more than MAX_SERVICES items', () => {
    const items = Array.from({ length: MAX_SERVICES + 1 }, () => ({
      title: 'x',
    })) as ServiceItem[];
    expect(validateServicesArray(items)).toEqual({ ok: false, reason: 'too-many' });
  });

  it('flags the first invalid item by index', () => {
    const items: ServiceItem[] = [
      { title: 'OK', description: '' },
      { title: '', description: '' },
      { title: 'Also OK', description: '' },
    ];
    expect(validateServicesArray(items)).toMatchObject({
      ok: false,
      reason: 'item-invalid',
      index: 1,
      itemReason: 'title-required',
    });
  });

  it('accepts an empty array (services is optional)', () => {
    expect(validateServicesArray([])).toEqual({ ok: true });
  });
});
