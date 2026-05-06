import type { EditorBundle } from '@/lib/editor/bundle';
import {
  DEFAULT_SECTION_ORDER,
  mergeOrder,
  type SectionKey,
} from '@/lib/editor/section-order';
import { SECTIONS } from '@/lib/editor/sections';

/**
 * In-page anchor nav for the public profile.
 *
 * Renders only the sections that have content — null-checks mirror each
 * Render component's logic (an empty list returns null, etc.). The
 * scroll-link uses native anchor behaviour; smooth scroll comes from
 * `html { scroll-behavior: smooth }` in globals.css with a
 * `prefers-reduced-motion` exemption.
 */
const ANCHOR_KEYS: SectionKey[] = [
  'about',
  'services',
  'photoGallery',
  'featuredTrack',
  'pressKitLink',
  'contact',
];

function hasContent(bundle: EditorBundle, key: SectionKey): boolean {
  const c = bundle.content as
    | { bio?: unknown; services?: unknown[]; tagline?: unknown }
    | null;
  switch (key) {
    case 'about':
      return Boolean(c?.bio);
    case 'services':
      return Array.isArray(c?.services) && c!.services.length > 0;
    case 'photoGallery': {
      const gallery = (bundle.profile as { gallery?: unknown[] }).gallery;
      return Array.isArray(gallery) && gallery.length > 0;
    }
    case 'featuredTrack':
      return Boolean(bundle.featuredTrack);
    case 'pressKitLink':
      return Boolean((bundle.profile as { pressKitUrl?: string }).pressKitUrl);
    case 'contact': {
      const p = bundle.profile as {
        contactWhatsapp?: string;
        contactEmail?: string;
        contactFormEnabled?: boolean;
      };
      return Boolean(p.contactWhatsapp || p.contactEmail || p.contactFormEnabled);
    }
    default:
      return false;
  }
}

export function AnchorNav({ bundle }: { bundle: EditorBundle }) {
  const persisted = (bundle.theme?.sectionOrder as Array<{ key: string }> | undefined)
    ?.map((entry) => entry.key as SectionKey);
  const order = mergeOrder(persisted ?? [...DEFAULT_SECTION_ORDER]);
  const labels = sectionLabels();

  const items = order
    .filter((key) => ANCHOR_KEYS.includes(key))
    .filter((key) => hasContent(bundle, key));

  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Seções deste perfil"
      className="sticky top-0 z-30 border-b border-border bg-bg/95 px-6 py-3 backdrop-blur md:px-12"
    >
      <ul className="flex flex-wrap gap-x-6 gap-y-2 text-xs uppercase tracking-wider">
        {items.map((key) => (
          <li key={key}>
            <a
              href={`#${anchorIdFor(key)}`}
              className="text-text-muted hover:text-text"
            >
              {labels[key]}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function sectionLabels(): Record<SectionKey, string> {
  const out = {} as Record<SectionKey, string>;
  for (const meta of Object.values(SECTIONS)) {
    out[meta.key] = meta.label;
  }
  return out;
}

/** The anchor ids each Render component would target. Kept here so the
 *  nav stays self-contained — if a section ships its own anchor id it
 *  must match this map. */
function anchorIdFor(key: SectionKey): string {
  switch (key) {
    case 'about':
      return 'sobre';
    case 'services':
      return 'servicos';
    case 'photoGallery':
      return 'galeria';
    case 'featuredTrack':
      return 'faixa';
    case 'pressKitLink':
      return 'press-kit';
    case 'contact':
      return 'contato';
    default:
      return key;
  }
}
