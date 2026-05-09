'use client';

import { useTranslations } from 'next-intl';

import type { EditorBundle } from '@/lib/editor/bundle';

import { ContactForm } from '../ContactForm';

/**
 * Bunker 909 Contact
 * Brutalist form container with industrial warning markers and heavy framing.
 */
export function ContactBunker909({ bundle }: { bundle: EditorBundle }) {
  const t = useTranslations('profile.contact');
  const showForm = bundle.content?.showContactForm !== false;
  const destinationEmail = (bundle.content?.contactEmail as string | undefined) ?? null;

  if (!showForm || !destinationEmail) return null;

  return (
    <section
      id="contato"
      className="relative border-b-4 border-[#1a1a1a] bg-black px-6 py-20 font-mono text-gray-400 md:px-12 md:py-32"
    >
      <div className="mx-auto max-w-4xl">
        <div className="relative border-4 border-[#1a1a1a] bg-[#050505] p-8 md:p-12">
          {/* Industrial Header for the Form */}
          <div className="mb-12 border-b-4 border-[#ff5c00] pb-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.4em] text-[#ff5c00] mb-2">
                   TRANSMISSION_CHANNEL // 04
                </p>
                <h2 className="font-display text-4xl uppercase tracking-tighter text-white md:text-6xl">
                  {t('label')}<span className="text-[#ff5c00]">.</span>TERMINAL
                </h2>
              </div>
              <div className="hidden h-16 w-16 bg-[#ff5c00] p-1 md:block">
                 <div className="h-full w-full border-2 border-black border-dashed flex items-center justify-center">
                    <span className="text-black font-bold text-xl">909</span>
                 </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 selection:bg-[#ff5c00] selection:text-black">
            <ContactForm
              profileId={bundle.profile.id}
              profileSlug={bundle.profile.slug}
              className="grid gap-8"
            />
          </div>

          {/* Warning Garnish */}
          <div className="mt-12 flex items-center gap-6 opacity-30">
             <div className="h-px flex-1 bg-[#1a1a1a]" />
             <span className="text-[10px] tracking-widest uppercase">Warning: Secure channel active</span>
             <div className="h-px flex-1 bg-[#1a1a1a]" />
          </div>
        </div>
        
        {/* Technical Footer Annotation */}
        <div className="mt-8 text-center text-[10px] tracking-widest text-[#333]">
           BUNKER_CORE // SMTP_RELAY_v1 // ENCRYPTED_HANDSHAKE
        </div>
      </div>
    </section>
  );
}
