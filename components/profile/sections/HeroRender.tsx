import type { EditorBundle } from '@/lib/editor/bundle';
import { mediaUrl } from '@/lib/media/url';

type HeroStyle = 'full-bleed-portrait' | 'split-portrait-text' | 'centered-logo';

export function HeroRender({ bundle }: { bundle: EditorBundle }) {
  const { profile, content } = bundle;
  const style = (bundle.theme?.heroStyle as HeroStyle | undefined) ?? 'full-bleed-portrait';
  const tagline = (content?.tagline as string | undefined) ?? null;
  const ctaLabel = (content?.ctaLabel as string | undefined) ?? null;
  const ctaUrl = (content?.ctaUrl as string | undefined) ?? null;

  const portraitMedia = profile.portrait as { bucket: string; path: string; alt?: string } | null | undefined;
  const logoMedia = profile.logo as { bucket: string; path: string; alt?: string } | null | undefined;
  const portraitUrl = mediaUrl(portraitMedia ?? null);
  const logoUrl = mediaUrl(logoMedia ?? null);

  const displayName = profile.slug.replace(/-/g, ' ');

  if (style === 'centered-logo') {
    return (
      <header className="flex flex-col items-center border-b border-border px-6 py-16 text-center md:px-12 md:py-24">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={logoMedia?.alt ?? ''}
            className="h-24 w-auto md:h-32"
          />
        ) : (
          <h1 className="font-display text-5xl uppercase tracking-tight md:text-7xl">
            {displayName}
          </h1>
        )}
        {tagline ? (
          <p className="mt-6 max-w-prose text-lg text-text-muted">{tagline}</p>
        ) : null}
        {ctaUrl ? <CtaButton url={ctaUrl} label={ctaLabel ?? 'Contato'} /> : null}
      </header>
    );
  }

  if (style === 'split-portrait-text') {
    return (
      <header className="grid gap-8 border-b border-border px-6 py-16 md:grid-cols-2 md:px-12 md:py-24">
        {portraitUrl ? (
          <img
            src={portraitUrl}
            alt={portraitMedia?.alt ?? ''}
            className="aspect-[3/4] w-full object-cover"
          />
        ) : (
          <div aria-hidden="true" className="aspect-[3/4] w-full bg-surface" />
        )}
        <div className="flex flex-col justify-center">
          {logoUrl ? (
            <img src={logoUrl} alt={logoMedia?.alt ?? ''} className="mb-6 h-12 w-auto" />
          ) : null}
          <p className="font-display text-xs uppercase tracking-widest text-text-muted">
            presskit.pro/{profile.slug}
          </p>
          <h1 className="mt-4 font-display text-5xl uppercase tracking-tight md:text-6xl">
            {displayName}
          </h1>
          {tagline ? (
            <p className="mt-6 max-w-prose text-lg text-text-muted">{tagline}</p>
          ) : null}
          {ctaUrl ? <CtaButton url={ctaUrl} label={ctaLabel ?? 'Contato'} /> : null}
        </div>
      </header>
    );
  }

  // Default: full-bleed-portrait.
  return (
    <header className="relative border-b border-border">
      {portraitUrl ? (
        <img
          src={portraitUrl}
          alt={portraitMedia?.alt ?? ''}
          className="h-[70vh] w-full object-cover"
        />
      ) : null}
      <div className="px-6 py-16 md:px-12 md:py-24">
        {logoUrl ? (
          <img src={logoUrl} alt={logoMedia?.alt ?? ''} className="mb-6 h-12 w-auto" />
        ) : null}
        <p className="font-display text-xs uppercase tracking-widest text-text-muted">
          presskit.pro/{profile.slug}
        </p>
        <h1 className="mt-4 font-display text-5xl uppercase tracking-tight md:text-7xl">
          {displayName}
        </h1>
        {tagline ? (
          <p className="mt-6 max-w-prose text-lg text-text-muted">{tagline}</p>
        ) : null}
        {ctaUrl ? <CtaButton url={ctaUrl} label={ctaLabel ?? 'Contato'} /> : null}
      </div>
    </header>
  );
}

function CtaButton({ url, label }: { url: string; label: string }) {
  return (
    <p className="mt-8">
      <a
        href={url}
        target={url.startsWith('http') ? '_blank' : undefined}
        rel={url.startsWith('http') ? 'noopener noreferrer' : undefined}
        className="inline-flex h-12 items-center border border-accent bg-accent px-6 text-sm uppercase tracking-wider text-accent-contrast"
      >
        {label}
      </a>
    </p>
  );
}
