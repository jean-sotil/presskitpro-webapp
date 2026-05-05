import { describe, expect, it, vi } from 'vitest';

import { handleSlugChange } from './profile-slug-changed';

function makeDeps() {
  const recordSlugChange = vi.fn().mockResolvedValue(undefined);
  return { supabase: {} as never, recordSlugChange };
}

describe('handleSlugChange', () => {
  it('does nothing on create', async () => {
    const deps = makeDeps();
    await handleSlugChange(
      { operation: 'create', doc: { slug: 'new' }, previousDoc: undefined },
      deps,
    );
    expect(deps.recordSlugChange).not.toHaveBeenCalled();
  });

  it('does nothing on update when the slug did not change', async () => {
    const deps = makeDeps();
    await handleSlugChange(
      {
        operation: 'update',
        doc: { slug: 'same' },
        previousDoc: { slug: 'same' },
      },
      deps,
    );
    expect(deps.recordSlugChange).not.toHaveBeenCalled();
  });

  it('calls recordSlugChange when the slug changes on update', async () => {
    const deps = makeDeps();
    await handleSlugChange(
      {
        operation: 'update',
        doc: { slug: 'new' },
        previousDoc: { slug: 'old' },
      },
      deps,
    );
    expect(deps.recordSlugChange).toHaveBeenCalledWith(deps.supabase, {
      oldSlug: 'old',
      newSlug: 'new',
    });
  });

  it('swallows errors from recordSlugChange (logs are out of scope)', async () => {
    const recordSlugChange = vi.fn().mockRejectedValue(new Error('db down'));
    await expect(
      handleSlugChange(
        {
          operation: 'update',
          doc: { slug: 'new' },
          previousDoc: { slug: 'old' },
        },
        { supabase: {} as never, recordSlugChange },
      ),
    ).resolves.toBeUndefined();
  });
});
