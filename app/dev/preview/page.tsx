import { notFound } from 'next/navigation';
import { Anchor } from '@/components/ui/Anchor';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { Section } from '@/components/ui/Section';
import { Tag } from '@/components/ui/Tag';
import { Grain } from '@/components/atmosphere/Grain';
import { RevealStagger } from '@/components/atmosphere/RevealStagger';
import { SectionMarker } from '@/components/atmosphere/SectionMarker';
import { accentPresets, bgPresets, fontPairs } from '@/lib/design/tokens';
import { ThemeSwitcher } from './theme-switcher';

/**
 * Internal showcase for the design system. Server component — the live theme
 * switcher is the only client part. 404 in production so this never ships
 * to end users.
 */
export default function PreviewPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return (
    <>
      <Grain />

      <ThemeSwitcher
        bgPresets={bgPresets}
        accentPresets={accentPresets}
        fontPairs={[...fontPairs]}
      />

      <Section id="typography">
        <SectionMarker number={1} label="TIPOGRAFIA" />
        <h1 className="font-display mt-4 text-6xl uppercase tracking-tight md:text-8xl">
          Editorial Nightlife
        </h1>
        <p className="font-editorial mt-6 max-w-2xl text-xl italic">
          São Paulo, ação, coração, mãe — a noite começa quando o sistema cala.
        </p>
        <p className="font-body mt-8 max-w-prose text-base text-text-muted">
          Diacríticos: ã ç ê õ á í ó ú. Curly quotes: “night” ‘mode’. Em-dash —
          and en–dash. Ligatures: fi fl. Numerals 0123456789. The quick brown
          fox jumps over the lazy dog.
        </p>
      </Section>

      <Section id="primitives">
        <SectionMarker number={2} label="PRIMITIVES" />

        <RevealStagger>
          <h2 className="font-display mt-4 text-3xl uppercase">Botões</h2>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Button>Reservar</Button>
            <Button variant="ghost">Detalhes</Button>
            <Button variant="link">Ver tudo →</Button>
            <Button size="sm">Pequeno</Button>
            <Button size="lg">Grande</Button>
            <Button disabled>Desabilitado</Button>
          </div>

          <h2 className="font-display mt-12 text-3xl uppercase">Cards e Tags</h2>

          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <Card>
              <p className="font-display text-xl uppercase">Bio</p>
              <p className="mt-2 text-sm text-text-muted">
                Card com surface e border tokenizados.
              </p>
              <div className="mt-4 flex gap-2">
                <Tag>Techno</Tag>
                <Tag>House</Tag>
                <Tag>Disco</Tag>
              </div>
            </Card>
            <Card>
              <p className="font-display text-xl uppercase">Serviços</p>
              <p className="mt-2 text-sm text-text-muted">
                Sharp edges, no shadow — editorial flat.
              </p>
            </Card>
            <Card>
              <p className="font-display text-xl uppercase">Ligações</p>
              <p className="mt-2 text-sm text-text-muted">
                <Anchor href="#">interno</Anchor> ·{' '}
                <Anchor href="https://example.com" external>
                  externo
                </Anchor>
              </p>
            </Card>
          </div>

          <h2 className="font-display mt-12 text-3xl uppercase">Icon buttons</h2>

          <div className="mt-6 flex gap-3">
            <IconButton label="Editar">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 20h4l10-10-4-4L4 16v4z" />
              </svg>
            </IconButton>
            <IconButton label="Apagar">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M5 6h14M9 6V4h6v2m-7 0v14h8V6" />
              </svg>
            </IconButton>
            <IconButton label="Compartilhar">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="6" cy="12" r="2" />
                <circle cx="18" cy="6" r="2" />
                <circle cx="18" cy="18" r="2" />
                <path d="M8 11l8-4M8 13l8 4" />
              </svg>
            </IconButton>
          </div>
        </RevealStagger>
      </Section>

      <Section id="contrast">
        <SectionMarker number={3} label="CONTRASTE" />
        <h2 className="font-display mt-4 text-3xl uppercase">Acentos</h2>
        <p className="text-sm text-text-muted">
          Cada amostra desenha o accent token em fundo padrão. Verifique
          legibilidade visualmente; o gate WCAG é executado por{' '}
          <code className="font-mono">pnpm contrast:check</code>.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {accentPresets.map((a) => (
            <div
              key={a.id}
              className="border border-border p-3 text-xs uppercase tracking-wider"
              style={{ color: a.hex }}
            >
              <div className="h-10 w-full" style={{ backgroundColor: a.hex }} />
              <div className="mt-2 text-text-muted">{a.label}</div>
              <div className="font-mono text-[0.65rem]">{a.hex}</div>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
