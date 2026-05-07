/**
 * Press-kit URL HEAD/GET fetcher (task-30).
 *
 * Pure DI on `fetch` and `now` so tests don't hit the network. Issues a
 * HEAD with an 8s timeout; if the host rejects HEAD (≥ 405 or 4xx),
 * retries with a single-byte ranged GET. Returns a discriminated result
 * the state machine in `next-health.ts` consumes via `checkOk`.
 */

const DEFAULT_TIMEOUT_MS = 8_000;

export type CheckDeps = {
  fetch: typeof globalThis.fetch;
  timeoutMs?: number;
};

export type CheckResult =
  | { ok: true; kind: 'http-2xx' | 'http-3xx'; statusCode: number }
  | {
      ok: false;
      kind: 'http-error' | 'timeout' | 'network-error';
      statusCode?: number;
    };

export async function checkPressKitUrl(
  url: string,
  deps: CheckDeps,
): Promise<CheckResult> {
  if (typeof url !== 'string' || url.trim() === '') {
    return { ok: false, kind: 'network-error' };
  }
  const timeoutMs = deps.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const head = await timed(() => deps.fetch(url, { method: 'HEAD', redirect: 'follow' }), timeoutMs);
  if (head.kind === 'timeout' || head.kind === 'thrown') {
    return head.kind === 'timeout'
      ? { ok: false, kind: 'timeout' }
      : { ok: false, kind: 'network-error' };
  }
  if (head.response.status < 300) {
    return { ok: true, kind: 'http-2xx', statusCode: head.response.status };
  }
  if (head.response.status < 400) {
    return { ok: true, kind: 'http-3xx', statusCode: head.response.status };
  }

  // 4xx/5xx on HEAD — some hosts (Drive, Notion) reject HEAD outright.
  // Retry with a single-byte ranged GET to confirm.
  const get = await timed(
    () => deps.fetch(url, { method: 'GET', redirect: 'follow', headers: { Range: 'bytes=0-0' } }),
    timeoutMs,
  );
  if (get.kind === 'timeout' || get.kind === 'thrown') {
    return get.kind === 'timeout'
      ? { ok: false, kind: 'timeout' }
      : { ok: false, kind: 'network-error' };
  }
  if (get.response.status < 400) {
    const kind = get.response.status < 300 ? 'http-2xx' : 'http-3xx';
    return { ok: true, kind, statusCode: get.response.status };
  }
  return { ok: false, kind: 'http-error', statusCode: get.response.status };
}

type TimedResult =
  | { kind: 'response'; response: Response }
  | { kind: 'timeout' }
  | { kind: 'thrown' };

async function timed(
  task: () => Promise<Response>,
  timeoutMs: number,
): Promise<TimedResult> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  try {
    const response = await Promise.race<Response | { __timeout: true }>([
      task(),
      new Promise<{ __timeout: true }>((resolve) => {
        timeoutId = setTimeout(() => resolve({ __timeout: true }), timeoutMs);
      }),
    ]);
    if ((response as { __timeout?: true }).__timeout) {
      return { kind: 'timeout' };
    }
    return { kind: 'response', response: response as Response };
  } catch {
    return { kind: 'thrown' };
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
