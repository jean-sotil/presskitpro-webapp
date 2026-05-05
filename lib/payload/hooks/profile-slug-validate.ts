import { validateSlugFormat } from '../../slug/format';

/**
 * Wraps `validateSlugFormat` for Payload's field-level `validate` signature
 * (returns `true` on success, error message string on failure).
 *
 * Defers to Payload's built-in `required` check when the value is missing.
 */
export function validateProfileSlug(value: string): string | true {
  if (typeof value !== 'string' || value.length === 0) return true;
  const result = validateSlugFormat(value);
  if (result.ok) return true;
  return `Slug invalid (${result.reason}).`;
}
