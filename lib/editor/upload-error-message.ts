/**
 * Translates `UploadResult` failures into PT-BR messages that are safe to
 * show end users in editor UIs. Centralized so the gallery, hero, and
 * onboarding wizards can stay in sync — and so a future locale switch
 * needs only one edit.
 *
 * The server's sign-upload route returns short English error strings
 * (e.g. "invalid size", "unsupported mime type"). They flow through
 * `media-upload.ts` as the `detail` field on `sign-failed`. We keyword
 * match them here rather than introducing an enum across the boundary.
 */

import type { UploadResult } from './media-upload';

type UploadFailure = Extract<UploadResult, { ok: false }>;

export function humanizeUploadError(result: UploadFailure): string {
  switch (result.reason) {
    case 'alt-required':
      return 'Texto alternativo é obrigatório.';
    case 'too-large':
      return `Imagem muito grande (${result.detail ?? ''}). Tente uma foto menor que 10 MB.`;
    case 'sign-failed': {
      const detail = (result.detail ?? '').toLowerCase();
      if (detail.includes('invalid size')) {
        return 'Imagem muito grande. Tente uma foto menor que 10 MB.';
      }
      if (detail.includes('unsupported mime')) {
        return 'Formato não suportado. Use JPEG, PNG, WebP ou AVIF.';
      }
      if (detail.includes('invalid bucket')) {
        return 'Erro de configuração do upload. Tente novamente.';
      }
      if (detail.includes('missing owner')) {
        return 'Sessão expirada. Faça login novamente.';
      }
      if (detail.includes('invalid json')) {
        return 'Erro ao preparar o upload. Recarregue a página.';
      }
      return result.detail
        ? `Falha ao gerar URL de upload: ${result.detail}`
        : 'Falha ao gerar URL de upload.';
    }
    case 'put-failed':
      return 'Falha ao enviar a imagem. Verifique sua conexão e tente novamente.';
    case 'register-failed':
      return 'Falha ao registrar a imagem. Tente enviar novamente.';
  }
}
