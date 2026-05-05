/**
 * Per-file upload phase enum. The gallery editor's `UploadQueue` shows
 * one row per file and advances through these phases as the pipeline
 * runs. `done` and `error` are terminal — callers can clear the row.
 *
 * Pure module; safe to import from server + client.
 */

export type UploadPhase =
  | 'queued'
  | 'compressing'
  | 'uploading'
  | 'registering'
  | 'done'
  | 'error';

export const PHASE_ORDER: UploadPhase[] = [
  'queued',
  'compressing',
  'uploading',
  'registering',
  'done',
];

export function isTerminalPhase(phase: UploadPhase): boolean {
  return phase === 'done' || phase === 'error';
}

const LABELS: Record<UploadPhase, string> = {
  queued: 'Aguardando...',
  compressing: 'Comprimindo...',
  uploading: 'Enviando...',
  registering: 'Salvando...',
  done: 'Pronto',
  error: 'Erro',
};

export function phaseLabel(phase: UploadPhase): string {
  return LABELS[phase];
}
