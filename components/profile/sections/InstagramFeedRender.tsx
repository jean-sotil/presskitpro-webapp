import type { EditorBundle } from '@/lib/editor/bundle';

export function InstagramFeedRender({ bundle }: { bundle: EditorBundle }) {
  if (!bundle.instagramConnection) return null;
  // Real grid lands in task-17. Until then, render nothing for visitors but
  // a small "connected" hint for the editor preview.
  return null;
}
