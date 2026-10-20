import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SprintMultiSelect } from '@/components/Sprint/SprintMultiSelect.tsx';
import {
  mockPreviousSprint,
  mockSprint,
  mockSprints,
} from '@/services/azureDevOps/mock/mockData.ts';
import { sprintValue } from '@/utils/sprint.ts';

describe('SprintMultiSelect', () => {
  it('adds another sprint and refuses to clear the last selection', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <SprintMultiSelect
        sprints={mockSprints}
        selected={[sprintValue(mockSprint)]}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByLabelText('Sprint'));
    await user.click(screen.getByRole('checkbox', { name: 'Sprint 41' }));

    expect(onChange).toHaveBeenCalledWith([
      sprintValue(mockSprint),
      sprintValue(mockPreviousSprint),
    ]);

    await user.click(screen.getByRole('checkbox', { name: 'Sprint 42' }));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('filters sprints from the dropdown search', async () => {
    const user = userEvent.setup();

    render(
      <SprintMultiSelect
        sprints={mockSprints}
        selected={[sprintValue(mockSprint)]}
        onChange={vi.fn()}
      />,
    );

    await user.click(screen.getByLabelText('Sprint'));
    await user.type(screen.getByLabelText('Buscar sprint'), '41');

    expect(screen.getByRole('checkbox', { name: 'Sprint 41' })).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: 'Sprint 42' })).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText('Buscar sprint'));
    await user.type(screen.getByLabelText('Buscar sprint'), 'zzzz');

    expect(screen.getByText('Nenhuma sprint encontrada')).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: 'Sprint 41' })).not.toBeInTheDocument();

    await user.click(screen.getByLabelText('Sprint'));
    await user.click(screen.getByLabelText('Sprint'));

    expect(screen.getByRole('checkbox', { name: 'Sprint 42' })).toBeInTheDocument();
  });

  it('keeps only the first selected sprint', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <SprintMultiSelect
        sprints={mockSprints}
        selected={[sprintValue(mockSprint), sprintValue(mockPreviousSprint)]}
        onChange={onChange}
      />,
    );

    expect(screen.getByLabelText('Sprint')).toHaveTextContent('2 sprints selecionadas');

    await user.click(screen.getByLabelText('Sprint'));
    await user.click(screen.getByRole('button', { name: 'Manter só a primeira' }));

    expect(onChange).toHaveBeenCalledWith([sprintValue(mockSprint)]);
  });
});
