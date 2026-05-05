/**
 * Pure validators for the Services list. The schema (`ProfileContent.services`)
 * stores `[{ title, description }]`; the editor enforces these limits
 * client-side before calling the content PATCH route. Server-side, Payload's
 * `maxLength` config provides defense-in-depth.
 */

export type ServiceItem = {
  title: string;
  description?: string;
};

export const MAX_SERVICES = 8;
const TITLE_MAX = 80;
const DESCRIPTION_MAX = 240;

export type ItemReason =
  | 'title-required'
  | 'title-too-long'
  | 'description-too-long';

type ItemResult = { ok: true } | { ok: false; reason: ItemReason };

export function validateServiceItem(item: ServiceItem): ItemResult {
  const title = (item.title ?? '').trim();
  if (title.length === 0) return { ok: false, reason: 'title-required' };
  if (title.length > TITLE_MAX) return { ok: false, reason: 'title-too-long' };
  const desc = item.description ?? '';
  if (desc.length > DESCRIPTION_MAX) {
    return { ok: false, reason: 'description-too-long' };
  }
  return { ok: true };
}

export type ArrayResult =
  | { ok: true }
  | { ok: false; reason: 'too-many' }
  | { ok: false; reason: 'item-invalid'; index: number; itemReason: ItemReason };

export function validateServicesArray(items: ServiceItem[]): ArrayResult {
  if (items.length > MAX_SERVICES) return { ok: false, reason: 'too-many' };
  for (let i = 0; i < items.length; i++) {
    const r = validateServiceItem(items[i]!);
    if (!r.ok) {
      return { ok: false, reason: 'item-invalid', index: i, itemReason: r.reason };
    }
  }
  return { ok: true };
}
