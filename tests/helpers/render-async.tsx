import {
  render,
  type RenderOptions,
  type RenderResult,
} from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';

/**
 * Render an async server component for unit tests. RTL's `render`
 * doesn't await Promises, so calling `render(<AsyncComp />)` produces
 * an empty DOM. Call the component as a function instead, await the
 * resolved JSX, then hand it to `render`. When the component returns
 * `null` we render an empty fragment so callers can still inspect
 * `container` for the empty-DOM assertion.
 *
 * Usage:
 *   await renderAsync(AboutRender({ bundle, variant: 'classic' }));
 */
export async function renderAsync(
  pending: ReactNode | Promise<ReactNode>,
  options?: RenderOptions,
): Promise<RenderResult> {
  const resolved = await pending;
  return render((resolved ?? null) as ReactElement, options);
}
