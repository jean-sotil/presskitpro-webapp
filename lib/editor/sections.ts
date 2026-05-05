import type { SectionKey } from './section-order';

export type SectionMeta = {
  key: SectionKey;
  /** PT-BR label for the rail. */
  label: string;
  /** Which downstream task implements the EditCard. */
  editorComesIn: number;
};

/**
 * The shell ships placeholders for every EditCard; tasks 10–17 swap each
 * one in. The label drives the rail + the "Edit X in task-NN" hint.
 */
export const SECTIONS: Record<SectionKey, SectionMeta> = {
  hero: { key: 'hero', label: 'Hero', editorComesIn: 10 },
  about: { key: 'about', label: 'Sobre', editorComesIn: 11 },
  services: { key: 'services', label: 'Serviços', editorComesIn: 11 },
  featuredTrack: { key: 'featuredTrack', label: 'Faixa em destaque', editorComesIn: 16 },
  instagramFeed: { key: 'instagramFeed', label: 'Instagram', editorComesIn: 17 },
  photoGallery: { key: 'photoGallery', label: 'Galeria', editorComesIn: 12 },
  pressKitLink: { key: 'pressKitLink', label: 'Press kit', editorComesIn: 15 },
  socialLinks: { key: 'socialLinks', label: 'Redes sociais', editorComesIn: 13 },
  contact: { key: 'contact', label: 'Contato', editorComesIn: 14 },
};

export function sectionLabels(): Record<SectionKey, string> {
  const out = {} as Record<SectionKey, string>;
  for (const meta of Object.values(SECTIONS)) {
    out[meta.key] = meta.label;
  }
  return out;
}
