/**
 * Gallery validation. Two gates:
 *   - Hard cap: 50 items (also enforced by `Profiles.gallery.maxRows`).
 *   - Per-item: every item must have non-empty alt OR `decorative: true`.
 *
 * Soft cap (24): non-blocking warning the editor surfaces above the
 * dropzone — "considere remover algumas fotos para uma carga mais leve".
 */

export type GalleryItem = {
  id: number | string;
  alt: string;
  decorative: boolean;
};

export const GALLERY_SOFT_CAP = 24;
export const GALLERY_HARD_CAP = 50;

export type ValidateResult =
  | { ok: true; warning?: 'soft-cap' }
  | { ok: false; reason: 'too-many' }
  | { ok: false; reason: 'missing-alt'; indices: number[] };

export function validateGallery(items: GalleryItem[]): ValidateResult {
  if (items.length > GALLERY_HARD_CAP) return { ok: false, reason: 'too-many' };

  const missing: number[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i]!;
    if (item.decorative) continue;
    if ((item.alt ?? '').trim().length === 0) missing.push(i);
  }
  if (missing.length > 0) {
    return { ok: false, reason: 'missing-alt', indices: missing };
  }
  if (items.length > GALLERY_SOFT_CAP) {
    return { ok: true, warning: 'soft-cap' };
  }
  return { ok: true };
}
