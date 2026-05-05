import type { SectionKey } from './section-order';

export type SectionMeta = {
  key: SectionKey;
  /** PT-BR label for the rail. */
  label: string;
  /** Which downstream task implements the EditCard. */
  editorComesIn: number;
  /** True once the section's real EditCard has shipped. EditorPane uses
   *  this flag to delegate between the live editor and the placeholder. */
  hasEditor: boolean;
};

/**
 * Tasks 10–17 each flip `hasEditor: true` and add a real EditCard. The
 * label drives the rail + the "Edit X in task-NN" placeholder copy.
 */
export const SECTIONS: Record<SectionKey, SectionMeta> = {
  hero: { key: 'hero', label: 'Hero', editorComesIn: 10, hasEditor: true },
  about: { key: 'about', label: 'Sobre', editorComesIn: 11, hasEditor: true },
  services: { key: 'services', label: 'Serviços', editorComesIn: 11, hasEditor: true },
  featuredTrack: { key: 'featuredTrack', label: 'Faixa em destaque', editorComesIn: 16, hasEditor: false },
  instagramFeed: { key: 'instagramFeed', label: 'Instagram', editorComesIn: 17, hasEditor: false },
  photoGallery: { key: 'photoGallery', label: 'Galeria', editorComesIn: 12, hasEditor: true },
  pressKitLink: { key: 'pressKitLink', label: 'Press kit', editorComesIn: 15, hasEditor: false },
  socialLinks: { key: 'socialLinks', label: 'Redes sociais', editorComesIn: 13, hasEditor: false },
  contact: { key: 'contact', label: 'Contato', editorComesIn: 14, hasEditor: false },
};

export function sectionLabels(): Record<SectionKey, string> {
  const out = {} as Record<SectionKey, string>;
  for (const meta of Object.values(SECTIONS)) {
    out[meta.key] = meta.label;
  }
  return out;
}
