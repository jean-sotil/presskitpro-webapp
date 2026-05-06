import Link from 'next/link';

import { Section } from '@/components/ui/Section';
import { SectionMarker } from '@/components/atmosphere/SectionMarker';

/**
 * Branded "press kit pausado" template (PRD §16).
 *
 * Rendered at HTTP 200 (NOT 404) so inbound links — Spotify bios,
 * email signatures, press releases — keep resolving. The Day-90
 * slug-reclamation cron (task-32) is what eventually frees the slug.
 */
export function PausedTemplate({ slug }: { slug: string }) {
  return (
    <main id="main">
      <Section className="max-w-3xl">
        <SectionMarker number={1} label="PRESS KIT PAUSADO" />
        <h1 className="mt-4 font-display text-5xl uppercase tracking-tight md:text-7xl">
          Este press kit está em pausa.
        </h1>
        <p className="mt-8 max-w-xl text-lg text-text-muted">
          O artista responsável por <strong>presskit.pro/{slug}</strong> ainda
          não retomou a assinatura. Volte em breve — a página estará no ar
          assim que o plano for reativado.
        </p>
        <p className="mt-6 max-w-xl text-base text-text-muted">
          É você o dono deste perfil?{' '}
          <Link className="underline" href="/login">
            Entrar e reativar
          </Link>
          .
        </p>
      </Section>
    </main>
  );
}
