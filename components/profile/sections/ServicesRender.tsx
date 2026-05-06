import type { EditorBundle } from '@/lib/editor/bundle';

export function ServicesRender({ bundle }: { bundle: EditorBundle }) {
  const services = (bundle.content?.services as
    | Array<{ title: string; description?: string }>
    | undefined) ?? [];
  if (services.length === 0) return null;
  return (
    <section id="servicos" className="border-b border-border px-6 py-16 md:px-12">
      <h2 className="font-display text-2xl uppercase tracking-tight">Serviços</h2>
      <ul className="mt-6 grid gap-4 md:grid-cols-2">
        {services.map((s, i) => (
          <li key={`${s.title}-${i}`} className="border border-border p-4">
            <p className="font-display uppercase tracking-wide">{s.title}</p>
            {s.description ? (
              <p className="mt-2 text-sm text-text-muted">{s.description}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
