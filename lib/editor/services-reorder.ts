import type { ServiceItem } from './services-validate';

/**
 * Pure index-based reorder. Used by the dnd-kit drag-end callback in
 * `ServicesEditCard`. Returns the original array if either index is out
 * of range — defensive against stale UI state.
 */
export function reorderServices(
  items: ServiceItem[],
  fromIndex: number,
  toIndex: number,
): ServiceItem[] {
  if (fromIndex === toIndex) return items;
  if (fromIndex < 0 || fromIndex >= items.length) return items;
  if (toIndex < 0 || toIndex >= items.length) return items;
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved!);
  return next;
}
