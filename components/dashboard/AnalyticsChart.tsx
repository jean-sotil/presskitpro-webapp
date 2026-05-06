import type { ChartShape } from '@/lib/analytics/format-chart';

/**
 * Server-rendered SVG bar chart. No client JS, no library.
 *
 * Accessibility: a hidden `<table>` mirrors the chart for screen
 * readers. The visible SVG carries `role="img"` + a per-bar `<title>`
 * so hover tooltips work without JS.
 */
export function AnalyticsChart({
  shape,
  label,
}: {
  shape: ChartShape;
  label: string;
}) {
  const W = 560;
  const H = 160;
  const pad = 12;
  const barWidth = (W - pad * 2) / shape.bars.length;

  return (
    <figure className="border border-border bg-surface p-6">
      <figcaption className="font-display text-xs uppercase tracking-widest text-text-muted">
        {label} — últimos 14 dias
      </figcaption>
      <svg
        role="img"
        viewBox={`0 0 ${W} ${H}`}
        className="mt-4 w-full"
        aria-label={`${label}, gráfico de barras de 14 dias`}
      >
        {shape.bars.map((bar, i) => {
          const h = Math.round(bar.ratio * (H - pad * 2));
          const x = pad + i * barWidth + barWidth * 0.15;
          const y = H - pad - h;
          const w = barWidth * 0.7;
          return (
            <g key={bar.day}>
              <title>{`${bar.day}: ${bar.count}`}</title>
              <rect
                x={x}
                y={y}
                width={w}
                height={Math.max(h, 1)}
                className="fill-text"
              />
            </g>
          );
        })}
      </svg>
      <table className="sr-only">
        <caption>{label} por dia</caption>
        <thead>
          <tr>
            <th>Dia</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {shape.bars.map((bar) => (
            <tr key={bar.day}>
              <td>{bar.day}</td>
              <td>{bar.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-4 font-display text-xs uppercase tracking-widest text-text-muted">
        Pico no período: {shape.maxCount}
      </p>
    </figure>
  );
}
