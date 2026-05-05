import type { EditorBundle } from '@/lib/editor/bundle';
import { mediaUrl } from '@/lib/media/url';

type GalleryEntry = {
  id: number;
  bucket: string;
  path: string;
  alt?: string;
  decorative?: boolean;
};

type GalleryLayout = 'mosaic' | 'uniform-grid' | 'carousel';

export function PhotoGalleryRender({ bundle }: { bundle: EditorBundle }) {
  const raw = bundle.profile.gallery as Array<GalleryEntry | number> | undefined;
  const items = Array.isArray(raw)
    ? raw.filter((entry): entry is GalleryEntry => typeof entry === 'object' && entry !== null && 'id' in entry)
    : [];
  if (items.length === 0) return null;

  const layout = (bundle.theme?.galleryLayout as GalleryLayout | undefined) ?? 'mosaic';

  return (
    <section className="border-b border-border px-6 py-16 md:px-12">
      <h2 className="font-display text-2xl uppercase tracking-tight">Galeria</h2>
      <ul className={gridClassFor(layout)}>
        {items.map((item) => {
          const src = mediaUrl({ bucket: item.bucket, path: item.path });
          if (!src) return null;
          const alt = item.decorative ? '' : item.alt ?? '';
          return (
            <li key={item.id} className={itemClassFor(layout)}>
              <img src={src} alt={alt} className="h-full w-full object-cover" loading="lazy" />
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function gridClassFor(layout: GalleryLayout): string {
  switch (layout) {
    case 'uniform-grid':
      return 'mt-6 grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-4';
    case 'carousel':
      // No-JS horizontal scroll. Task-19 polish replaces with a real carousel.
      return 'mt-6 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2';
    case 'mosaic':
    default:
      return 'mt-6 grid grid-cols-2 gap-2 md:grid-cols-4 md:auto-rows-[200px] md:gap-4';
  }
}

function itemClassFor(layout: GalleryLayout): string {
  switch (layout) {
    case 'uniform-grid':
      return 'aspect-square overflow-hidden';
    case 'carousel':
      return 'aspect-[3/4] w-64 flex-shrink-0 snap-start overflow-hidden';
    case 'mosaic':
    default:
      // Every 5th item spans 2 columns + 2 rows for visual rhythm.
      return 'aspect-square overflow-hidden md:[&:nth-child(5n+1)]:row-span-2 md:[&:nth-child(5n+1)]:col-span-2 md:[&:nth-child(5n+1)]:aspect-auto';
  }
}
