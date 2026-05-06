import { describe, expect, it, vi } from 'vitest';

import { handleProfileRevalidate } from './profile-revalidate';

function makeDeps() {
  return { revalidatePath: vi.fn() };
}

describe('handleProfileRevalidate', () => {
  it('revalidates `/${slug}` when status === published on create', () => {
    const deps = makeDeps();
    handleProfileRevalidate(
      {
        operation: 'create',
        doc: { slug: 'mariana', status: 'published' },
      },
      deps,
    );
    expect(deps.revalidatePath).toHaveBeenCalledWith('/mariana');
    // status flipped (undefined → 'published') so the sitemap is also bumped.
    expect(deps.revalidatePath).toHaveBeenCalledWith('/sitemap.xml');
  });

  it('does NOT revalidate when status is draft', () => {
    const deps = makeDeps();
    handleProfileRevalidate(
      {
        operation: 'create',
        doc: { slug: 'mariana', status: 'draft' },
      },
      deps,
    );
    // status went from undefined to 'draft' — counts as a flip → sitemap bumps,
    // but no slug bust (the slug was never live).
    expect(deps.revalidatePath).not.toHaveBeenCalledWith('/mariana');
  });

  it('revalidates BOTH the old and new slug when slug changes on a published doc', () => {
    const deps = makeDeps();
    handleProfileRevalidate(
      {
        operation: 'update',
        doc: { slug: 'mariana-2', status: 'published' },
        previousDoc: { slug: 'mariana', status: 'published' },
      },
      deps,
    );
    expect(deps.revalidatePath).toHaveBeenCalledWith('/mariana');
    expect(deps.revalidatePath).toHaveBeenCalledWith('/mariana-2');
    // Slug rotated → sitemap bumped too.
    expect(deps.revalidatePath).toHaveBeenCalledWith('/sitemap.xml');
  });

  it('revalidates the old slug when transitioning published -> unpublished (so the public page invalidates)', () => {
    const deps = makeDeps();
    handleProfileRevalidate(
      {
        operation: 'update',
        doc: { slug: 'mariana', status: 'unpublished' },
        previousDoc: { slug: 'mariana', status: 'published' },
      },
      deps,
    );
    expect(deps.revalidatePath).toHaveBeenCalledWith('/mariana');
  });

  it('is a no-op on delete (the public route already misses; cache-busting is decorative)', () => {
    const deps = makeDeps();
    handleProfileRevalidate(
      {
        operation: 'delete',
        doc: { slug: 'mariana', status: 'published' },
      },
      deps,
    );
    expect(deps.revalidatePath).not.toHaveBeenCalled();
  });

  it('swallows "static generation store missing" — revalidatePath outside a Next request (seed scripts, crons)', () => {
    const revalidatePath = vi.fn(() => {
      throw new Error(
        'Invariant: static generation store missing in revalidatePath /mariana',
      );
    });
    expect(() =>
      handleProfileRevalidate(
        {
          operation: 'create',
          doc: { slug: 'mariana', status: 'published' },
        },
        { revalidatePath },
      ),
    ).not.toThrow();
    expect(revalidatePath).toHaveBeenCalled();
  });

  it('rethrows unrelated errors (a real bug in revalidatePath should not be silently eaten)', () => {
    const revalidatePath = vi.fn(() => {
      throw new Error('TypeError: undefined is not a function');
    });
    expect(() =>
      handleProfileRevalidate(
        {
          operation: 'create',
          doc: { slug: 'mariana', status: 'published' },
        },
        { revalidatePath },
      ),
    ).toThrow(/undefined is not a function/);
  });
});
