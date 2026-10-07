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
    expect(
      screen.getByRole('combobox', { name: 'Coluna do board' }),
    ).toBeInTheDocument();
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
    await user.selectOptions(screen.getByLabelText('Status do item'), 'Active');
    await user.selectOptions(screen.getByLabelText('Coluna do board'), 'Ag. QA');

    expect(onTypeChange).toHaveBeenCalledWith('Task');
    expect(onStateChange).toHaveBeenCalledWith('Active');
    expect(onBoardColumnChange).toHaveBeenCalledWith('Ag. QA');
  });

  it('selects multiple developers in lead mode', async () => {
    const user = userEvent.setup();
    const onDevelopersChange = vi.fn();
    const { rerender } = render(
      <WorkItemFilters
        type="all"
        state="all"
        boardColumn="all"
        states={[]}
        boardColumns={[]}
        developers={['Alex Santos', 'Sophie Quines']}
        selectedDevelopers={[]}
        onTypeChange={vi.fn()}
        onStateChange={vi.fn()}
        onBoardColumnChange={vi.fn()}
        onDevelopersChange={onDevelopersChange}
      />,
    );

    await user.click(screen.getByText('Todos os desenvolvedores'));
    await user.click(screen.getByLabelText('Alex Santos'));
    expect(onDevelopersChange).toHaveBeenCalledWith(['Alex Santos']);

    rerender(
      <WorkItemFilters
        type="all"
        state="all"
        boardColumn="all"
        states={[]}
        boardColumns={[]}
        developers={['Alex Santos', 'Sophie Quines']}
        selectedDevelopers={['Alex Santos']}
        onTypeChange={vi.fn()}
        onStateChange={vi.fn()}
        onBoardColumnChange={vi.fn()}
        onDevelopersChange={onDevelopersChange}
      />,
    );

    await user.click(screen.getByLabelText('Sophie Quines'));
    expect(onDevelopersChange).toHaveBeenLastCalledWith([
      'Alex Santos',
      'Sophie Quines',
    ]);
  });
});
