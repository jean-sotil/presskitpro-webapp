/**
 * The 9 reorderable sections of the public profile (PRD §6.3). The default
 * ordering is the canonical layout the design system was built around;
 * users can rearrange via drag-drop, persisted on `Themes.sectionOrder`.
 *
 * `mergeOrder` reconciles a persisted order with the registry so the editor
 * always has a complete, valid list — even after a section was renamed or
 * the persisted state is partial (e.g. wizard-created profiles, where the
 * Themes row doesn't exist yet).
 */

export const DEFAULT_SECTION_ORDER = [
  'hero',
  'about',
  'services',
  'featuredTrack',
  'instagramFeed',
  'photoGallery',
  'pressKitLink',
  'socialLinks',
  'contact',
] as const;

export type SectionKey = (typeof DEFAULT_SECTION_ORDER)[number];

const REGISTRY: ReadonlySet<SectionKey> = new Set(DEFAULT_SECTION_ORDER);

export function mergeOrder(
  persisted: SectionKey[] | null | undefined,
): SectionKey[] {
  if (!persisted || persisted.length === 0) {
    return [...DEFAULT_SECTION_ORDER];
  }
  const seen = new Set<SectionKey>();
  const out: SectionKey[] = [];
  for (const key of persisted) {
    if (REGISTRY.has(key) && !seen.has(key)) {
      out.push(key);
      seen.add(key);
    }
  }
  for (const key of DEFAULT_SECTION_ORDER) {
    if (!seen.has(key)) out.push(key);
  }
  return out;
}

/**
 * Move `from` to the position currently occupied by `to`. The dnd-kit
 * onDragEnd callback expresses moves this way (drop target's index).
 * Returns the original array when either key is missing — defensive
 * against stale UI state.
 */
export function reorderSection(
  order: SectionKey[],
  from: SectionKey,
  to: SectionKey,
): SectionKey[] {
  if (from === to) return order;
  const fromIdx = order.indexOf(from);
  const toIdx = order.indexOf(to);
  if (fromIdx < 0 || toIdx < 0) return order;
  const next = [...order];
  next.splice(fromIdx, 1);
  next.splice(toIdx, 0, from);
  return next;
}
