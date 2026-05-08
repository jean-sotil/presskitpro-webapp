import type { EditorBundle } from '@/lib/editor/bundle';

/**
 * Hard Techno Underground marquee — accent-blue ticker band that scrolls
 * the artist name across the full viewport width. The track is duplicated
 * so the `translateX(-50%)` animation loops seamlessly. `aria-hidden`
 * because the same name is already announced by the hero `<h1>`.
 *
 * Animation respects `prefers-reduced-motion` via the `motion-safe:`
 * Tailwind variant — reduced-motion users see a static repeating row.
 */
export function Marquee({
  bundle,
  source,
}: {
  bundle: EditorBundle;
  source: 'displayName' | 'tagline';
}) {
  const text = resolveText(bundle, source);
  if (!text) return null;
  const REPEAT = 8;
  const items = Array.from({ length: REPEAT }, (_, i) => ({ i, text }));
  return (
    <aside
      aria-hidden="true"
      data-marquee-source={source}
      className="overflow-hidden border-y border-border bg-accent py-3"
    >
      <div className="flex w-max motion-safe:animate-[marquee_18s_linear_infinite]">
        {[0, 1].map((track) => (
          <ul
            key={track}
            className="flex shrink-0 items-center"
            aria-hidden={track === 1 ? 'true' : undefined}
          >
            {items.map((item) => (
              <li
                key={`${track}-${item.i}`}
                className="px-6 font-display text-2xl font-black uppercase tracking-wider text-accent-contrast md:text-4xl"
              >
                <span aria-hidden="true" className="mr-6 opacity-70">
                  —
                </span>
                {item.text}
              </li>
            ))}
          </ul>
        ))}
      </div>
    </aside>
  );
}

function resolveText(
  bundle: EditorBundle,
  source: 'displayName' | 'tagline',
): string | null {
  if (source === 'displayName') {
    const slug = String(bundle.profile.slug ?? '');
    return slug ? slug.replace(/-/g, ' ') : null;
  }
  const tagline = (bundle.content?.tagline as string | undefined) ?? null;
  return tagline?.trim() || null;
}
