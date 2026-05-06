/**
 * Top-5 referrers across the rollup window. Pre-aggregated by the
 * dashboard page (counts merged across the 14 days, top-5 by total).
 */
export function TopReferrers({
  rows,
}: {
  rows: Array<{ host: string; count: number }>;
}) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-text-muted">
        Ainda sem referenciadores externos. Compartilhe seu link e volte aqui.
      </p>
    );
  }
  return (
    <ol className="space-y-2">
      {rows.map((row, i) => (
        <li
          key={row.host}
          className="flex items-baseline justify-between gap-4 border-b border-border py-2 text-sm"
        >
          <span className="flex items-baseline gap-3">
            <span className="font-display text-xs uppercase tracking-widest text-text-muted">
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="text-text">{row.host}</span>
          </span>
          <span className="font-display text-xs uppercase tracking-widest text-text-muted">
            {row.count}
          </span>
        </li>
      ))}
    </ol>
  );
}
