import type { EventType, RollupRow } from './aggregate-rollup';

/**
 * Pure shape-prep for the dashboard SVG. Takes the rollup rows the
 * dashboard reads and returns a 14-bar series ready for direct render.
 *
 * Default mode (`eventType` omitted) shows `page_view` — the headline
 * traffic metric. Pass an explicit `eventType` to switch the bar series.
 */

const WINDOW_DAYS = 14;

export type ChartBar = {
  day: string; // YYYY-MM-DD
  count: number;
  /** 0..1 height ratio; useful for raw SVG <rect height="..."> math. */
  ratio: number;
};

export type ChartShape = {
  days: string[]; // length WINDOW_DAYS, oldest first
  bars: ChartBar[]; // length WINDOW_DAYS, oldest first
  maxCount: number;
};

export type ChartInputRow = {
  day: string;
  eventType: EventType;
  count: number;
} & Partial<Omit<RollupRow, 'day' | 'eventType' | 'count'>>;

export function formatChart(args: {
  rows: ChartInputRow[];
  today: Date;
  eventType?: EventType;
}): ChartShape {
  const eventType = args.eventType ?? 'page_view';
  const days = buildDayWindow(args.today);
  const dayIndex = new Map<string, number>(days.map((d, i) => [d, i] as const));

  const counts = new Array<number>(WINDOW_DAYS).fill(0);
  for (const row of args.rows) {
    if (row.eventType !== eventType) continue;
    const idx = dayIndex.get(row.day);
    if (idx === undefined) continue;
    counts[idx]! += row.count;
  }

  const maxCount = counts.reduce((m, c) => (c > m ? c : m), 0);
  const bars: ChartBar[] = days.map((day, i) => ({
    day,
    count: counts[i]!,
    ratio: maxCount === 0 ? 0 : counts[i]! / maxCount,
  }));
  return { days, bars, maxCount };
}

function buildDayWindow(today: Date): string[] {
  const out: string[] = [];
  const baseUtc = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
  );
  for (let i = WINDOW_DAYS - 1; i >= 0; i -= 1) {
    const d = new Date(baseUtc - i * 24 * 60 * 60 * 1000);
    out.push(toYmd(d));
  }
  return out;
}

function toYmd(d: Date): string {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
