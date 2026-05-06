/**
 * Skip-to-content link. Mounted once in the root layout; jumps focus to
 * `<main id="main">` so keyboard + screen-reader users bypass the
 * persistent navigation chrome on every route.
 *
 * The element is `sr-only` until focused — visible on Tab, invisible on
 * mouse paths so the design language stays clean.
 */
export function SkipToContent({ target = 'main' }: { target?: string }) {
  return (
    <a
      href={`#${target}`}
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:inline-flex focus:h-10 focus:items-center focus:bg-text focus:px-4 focus:font-display focus:text-xs focus:uppercase focus:tracking-widest focus:text-bg focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-accent"
    >
      Pular para o conteúdo
    </a>
  );
}
