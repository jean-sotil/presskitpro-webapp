import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StepShell } from './StepShell';

describe('StepShell', () => {
  it('renders the step indicator + title + content', () => {
    render(
      <StepShell step={2} total={5} title="Imagens">
        <input aria-label="portrait" />
      </StepShell>,
    );
    expect(screen.getByText(/passo 2 \/ 5/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /imagens/i })).toBeInTheDocument();
    expect(screen.getByLabelText('portrait')).toBeInTheDocument();
  });

  it('renders helper copy when provided', () => {
    render(
      <StepShell step={1} total={5} title="URL" helper="Pode mudar depois.">
        <input />
      </StepShell>,
    );
    expect(screen.getByText('Pode mudar depois.')).toBeInTheDocument();
  });
});
