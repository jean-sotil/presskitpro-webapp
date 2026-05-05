import { describe, expect, it } from 'vitest';

import {
  type UploadPhase,
  isTerminalPhase,
  phaseLabel,
  PHASE_ORDER,
} from './upload-phase';

describe('PHASE_ORDER', () => {
  it('lists every phase the upload pipeline emits, in order', () => {
    expect(PHASE_ORDER).toEqual([
      'queued',
      'compressing',
      'uploading',
      'registering',
      'done',
    ]);
  });
});

describe('isTerminalPhase', () => {
  it.each([
    ['queued', false],
    ['compressing', false],
    ['uploading', false],
    ['registering', false],
    ['done', true],
    ['error', true],
  ] as Array<[UploadPhase, boolean]>)('%s → %s', (phase, expected) => {
    expect(isTerminalPhase(phase)).toBe(expected);
  });
});

describe('phaseLabel', () => {
  it('returns localized PT-BR labels', () => {
    expect(phaseLabel('queued')).toBe('Aguardando...');
    expect(phaseLabel('compressing')).toBe('Comprimindo...');
    expect(phaseLabel('uploading')).toBe('Enviando...');
    expect(phaseLabel('registering')).toBe('Salvando...');
    expect(phaseLabel('done')).toBe('Pronto');
    expect(phaseLabel('error')).toBe('Erro');
  });
});
