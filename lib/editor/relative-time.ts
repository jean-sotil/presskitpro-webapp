/**
 * "há 12s", "há 4 min", "há 2 d" — locale-aware relative-time formatter
 * for the editor's save status. Wraps Intl.RelativeTimeFormat (no extra
 * dependency).
 *
 * Future timestamps and < 5s deltas collapse to "agora" because the
 * indicator should never show "in 1 second" — that's just clock skew.
 */

const FRESH_WINDOW_MS = 5_000;

type FromArg = number | Date | string;

function toMs(from: FromArg): number {
  if (typeof from === 'number') return from;
  if (from instanceof Date) return from.getTime();
  return new Date(from).getTime();
}

export function formatRelative(
  from: FromArg,
  now: number = Date.now(),
  locale: string = 'pt-BR',
): string {
  const fromMs = toMs(from);
  const deltaMs = now - fromMs;
  if (deltaMs < FRESH_WINDOW_MS) return 'agora';

  const fmt = new Intl.RelativeTimeFormat(locale, {
    numeric: 'always',
    style: 'short',
  });

  const seconds = Math.floor(deltaMs / 1000);
  if (seconds < 60) return fmt.format(-seconds, 'second');

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return fmt.format(-minutes, 'minute');

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return fmt.format(-hours, 'hour');

  const days = Math.floor(hours / 24);
  return fmt.format(-days, 'day');
}
