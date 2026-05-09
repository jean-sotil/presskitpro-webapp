'use client';

import { useTranslations } from 'next-intl';

import type { EditorBundle } from '@/lib/editor/bundle';
import type { Profile } from '@/payload-types';

import { ContactForm } from '../ContactForm';

/**
 * Nuclear Winter Contact
 * Secure terminal terminal for fallout-proof communications.
 */
export function ContactNuclearWinter({ bundle }: { bundle: EditorBundle }) {
  const t = useTranslations('profile.contact');
  const profile = bundle.profile as unknown as Profile;
  const showForm = profile.contactFormEnabled === true;
  const destinationEmail = (profile.contactFormDestination || profile.contactEmail) as string | undefined;

  if (!showForm || !destinationEmail) return null;

  return (
    <section
      id="contato"
      className="relative border-b border-[#39ff14]/10 bg-[#050705] px-6 py-20 font-mono text-gray-400 md:px-12 md:py-32"
    >
      <div className="mx-auto max-w-4xl">
        <div className="relative border border-[#39ff14]/20 bg-black p-8 md:p-12">
          {/* Header */}
          <div className="mb-12 border-b border-[#39ff14]/30 pb-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.4em] text-[#39ff14] mb-2">
                   SECURE_COMM_v3 // CH_04
                </p>
                <h2 className="font-display text-4xl uppercase tracking-tighter text-white md:text-6xl">
                  {t('label')}<span className="text-[#39ff14]">.</span>PORTAL
                </h2>
              </div>
              <div className="hidden h-14 w-14 border border-[#39ff14] p-1 md:block">
                 <div className="h-full w-full bg-[#39ff14]/20 flex items-center justify-center">
                    <span className="text-[#39ff14] font-bold text-lg animate-pulse">!</span>
                 </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 selection:bg-[#39ff14] selection:text-black">
            <ContactForm
              profileId={profile.id}
            />
          </div>

          {/* Footer warning */}
          <div className="mt-12 flex items-center gap-4 opacity-30">
             <div className="h-px flex-1 bg-[#39ff14]/20" />
             <span className="text-[9px] tracking-[0.4em] uppercase text-[#39ff14]">Transmission encrypted via fallout-net</span>
             <div className="h-px flex-1 bg-[#39ff14]/20" />
          </div>
        </div>
        
        {/* Decorative metadata */}
        <div className="mt-8 text-center text-[9px] tracking-[0.5em] text-[#222] uppercase">
           VAULT_CORE // SMTP_SECURE // RAD_SHIELD_ACTIVE
        </div>
      </div>
    </section>
  );
}
