import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { UploadQueue } from './UploadQueue';

describe('UploadQueue', () => {
  it('returns null when there are no rows', () => {
    const { container } = render(<UploadQueue rows={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders one row per file with the phase label', () => {
    render(
      <UploadQueue
        rows={[
          { id: '1', filename: 'one.avif', phase: 'compressing' },
          { id: '2', filename: 'two.jpg', phase: 'uploading' },
          { id: '3', filename: 'three.jpg', phase: 'done' },
        ]}
      />,
    );
    expect(screen.getByText('one.avif')).toBeInTheDocument();
    expect(screen.getByText(/comprimindo/i)).toBeInTheDocument();
    expect(screen.getByText(/enviando/i)).toBeInTheDocument();
    expect(screen.getByText(/pronto/i)).toBeInTheDocument();
  });

  it('shows the error message when phase=error', () => {
    render(
      <UploadQueue
        rows={[{ id: '1', filename: 'bad.jpg', phase: 'error', errorMessage: 'put-failed' }]}
      />,
    );
    expect(screen.getByText(/erro: put-failed/i)).toBeInTheDocument();
  });

  it('exposes a "Fechar" action only when every row is in a terminal phase', () => {
    const onClear = vi.fn();
    const { rerender } = render(
      <UploadQueue
        onClear={onClear}
        rows={[
          { id: '1', filename: 'one.jpg', phase: 'uploading' },
          { id: '2', filename: 'two.jpg', phase: 'done' },
        ]}
      />,
    );
    expect(screen.queryByRole('button', { name: /fechar/i })).toBeNull();

    rerender(
      <UploadQueue
        onClear={onClear}
        rows={[
          { id: '1', filename: 'one.jpg', phase: 'done' },
          { id: '2', filename: 'two.jpg', phase: 'error', errorMessage: 'x' },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /fechar/i }));
    expect(onClear).toHaveBeenCalled();
  });
});
