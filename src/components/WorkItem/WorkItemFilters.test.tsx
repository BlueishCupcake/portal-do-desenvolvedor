import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { WorkItemFilters } from '@/components/WorkItem/WorkItemFilters.tsx';

describe('WorkItemFilters', () => {
  it('renders type filters and board options', () => {
    render(
      <WorkItemFilters
        type="all"
        state="all"
        boardColumn="all"
        states={['Active']}
        boardColumns={['Ag. QA']}
        onTypeChange={vi.fn()}
        onStateChange={vi.fn()}
        onBoardColumnChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Bugs' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Board' })).toBeInTheDocument();
  });

  it('emits filter changes', async () => {
    const user = userEvent.setup();
    const onTypeChange = vi.fn();
    const onStateChange = vi.fn();
    const onBoardColumnChange = vi.fn();

    render(
      <WorkItemFilters
        type="all"
        state="all"
        boardColumn="all"
        states={['Active']}
        boardColumns={['Ag. QA']}
        onTypeChange={onTypeChange}
        onStateChange={onStateChange}
        onBoardColumnChange={onBoardColumnChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Tasks' }));
    await user.selectOptions(screen.getByLabelText('Estado'), 'Active');
    await user.selectOptions(screen.getByLabelText('Board'), 'Ag. QA');

    expect(onTypeChange).toHaveBeenCalledWith('Task');
    expect(onStateChange).toHaveBeenCalledWith('Active');
    expect(onBoardColumnChange).toHaveBeenCalledWith('Ag. QA');
  });
});
