import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { MobileTabs } from './MobileTabs';

const panes = { edit: <div data-testid="edit">EDIT</div>, preview: <div data-testid="preview">PREVIEW</div> };

describe('MobileTabs', () => {
  it('renders both tablist buttons + the initial pane', () => {
    render(<MobileTabs panes={panes} syncHash={false} />);
    expect(screen.getByRole('tab', { name: /editar/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tab', { name: /visualizar/i })).toHaveAttribute(
      'aria-selected',
      'false',
    );
    // The hidden attr is enough — no need to query for its presence.
    expect(screen.getByTestId('edit').parentElement).not.toHaveAttribute('hidden');
    expect(screen.getByTestId('preview').parentElement).toHaveAttribute('hidden');
  });

  it('switches panes on click', () => {
    render(<MobileTabs panes={panes} syncHash={false} />);
    fireEvent.click(screen.getByRole('tab', { name: /visualizar/i }));
    expect(screen.getByRole('tab', { name: /visualizar/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('switches with arrow keys', () => {
    render(<MobileTabs panes={panes} syncHash={false} />);
    const tablist = screen.getByRole('tablist');
    fireEvent.keyDown(tablist, { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: /visualizar/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    fireEvent.keyDown(tablist, { key: 'ArrowLeft' });
    expect(screen.getByRole('tab', { name: /editar/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('Home + End jump to first/last', () => {
    render(<MobileTabs panes={panes} syncHash={false} initial="preview" />);
    const tablist = screen.getByRole('tablist');
    fireEvent.keyDown(tablist, { key: 'Home' });
    expect(screen.getByRole('tab', { name: /editar/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    fireEvent.keyDown(tablist, { key: 'End' });
    expect(screen.getByRole('tab', { name: /visualizar/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('fires onChange with the new tab', () => {
    const onChange = vi.fn();
    render(<MobileTabs panes={panes} syncHash={false} onChange={onChange} />);
    fireEvent.click(screen.getByRole('tab', { name: /visualizar/i }));
    expect(onChange).toHaveBeenCalledWith('preview');
  });
});
