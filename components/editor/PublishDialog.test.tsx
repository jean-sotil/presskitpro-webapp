import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { PublishDialog } from './PublishDialog';

beforeAll(() => {
  // jsdom doesn't implement <dialog>'s methods natively.
  if (!HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
      this.setAttribute('open', '');
    });
  }
  if (!HTMLDialogElement.prototype.close) {
    HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
      this.removeAttribute('open');
      this.dispatchEvent(new Event('close'));
    });
  }
});

const baseProps = {
  open: true,
  intent: 'publish' as const,
  slug: 'mariana-luz',
  pending: false,
};

describe('PublishDialog', () => {
  it('renders the publish copy + slug', () => {
    render(
      <PublishDialog {...baseProps} onConfirm={vi.fn()} onClose={vi.fn()} />,
    );
    expect(screen.getByRole('heading', { name: /publicar perfil/i })).toBeInTheDocument();
    expect(screen.getByText(/mariana-luz/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^publicar$/i })).toBeInTheDocument();
  });

  it('renders the unpublish copy when intent=unpublish', () => {
    render(
      <PublishDialog
        {...baseProps}
        intent="unpublish"
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByRole('heading', { name: /despublicar perfil/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^despublicar$/i })).toBeInTheDocument();
  });

  it('disables both buttons + shows "Aguarde..." while pending', () => {
    render(
      <PublishDialog
        {...baseProps}
        pending
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /aguarde/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeDisabled();
  });

  it('fires onConfirm on the publish button', () => {
    const onConfirm = vi.fn();
    render(
      <PublishDialog
        {...baseProps}
        onConfirm={onConfirm}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /^publicar$/i }));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('fires onClose when Cancel is clicked', () => {
    const onClose = vi.fn();
    render(
      <PublishDialog
        {...baseProps}
        onConfirm={vi.fn()}
        onClose={onClose}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
