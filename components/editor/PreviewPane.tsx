'use client';

import { ProfileRenderer } from '@/components/profile/ProfileRenderer';
import type { EditorBundle } from '@/lib/editor/bundle';

export interface PreviewPaneProps {
  bundle: EditorBundle;
}

/**
 * Optimistic preview pane. The bundle here is the TanStack Query cache
 * value, which `setQueryData` updates synchronously from the editor's
 * onChange handlers — so the preview reflects edits within a tick.
 */
export function PreviewPane({ bundle }: PreviewPaneProps) {
  return (
    <div className="overflow-hidden border border-border">
      <ProfileRenderer bundle={bundle} mode="preview" />
    </div>
  );
}
