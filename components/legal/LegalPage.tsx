type LegalSection = { heading: string; body: string };

export interface LegalPageProps {
  title: string;
  intro: string;
  updatedLabel: string;
  updatedAt: string;
  draftBadge?: string;
  sections: ReadonlyArray<LegalSection>;
}

export function LegalPage(props: LegalPageProps) {
  return (
    <main id="main" className="mx-auto max-w-3xl px-6 py-16 md:px-12 md:py-24">
      {props.draftBadge ? (
        <p className="mb-6 inline-block border border-border bg-surface px-3 py-1 text-xs uppercase tracking-wider text-text-muted">
          {props.draftBadge}
        </p>
      ) : null}
      <h1 className="font-display text-4xl uppercase tracking-tight md:text-5xl">
        {props.title}
      </h1>
      <p className="mt-3 text-xs uppercase tracking-wider text-text-muted">
        {props.updatedLabel} {props.updatedAt}
      </p>
      <p className="mt-8 text-base text-text-muted">{props.intro}</p>
      <div className="mt-12 space-y-10">
        {props.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="font-display text-xl uppercase tracking-tight">
              {section.heading}
            </h2>
            <p className="mt-3 text-base text-text-muted">{section.body}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
