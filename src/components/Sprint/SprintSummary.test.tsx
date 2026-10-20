import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SprintSummary } from '@/components/Sprint/SprintSummary.tsx';
import {
  mockPreviousSprint,
  mockSprint,
  mockSprints,
} from '@/services/azureDevOps/mock/mockData.ts';
import { sprintValue } from '@/utils/sprint.ts';

describe('SprintSummary', () => {
  it('renders a placeholder while the sprint is unknown', () => {
    render(<SprintSummary />);

    expect(screen.getByText('Identificando a Sprint atual...')).toBeInTheDocument();
  });

  it('renders the sprint name and period', () => {
    render(<SprintSummary sprint={mockSprint} />);

    expect(screen.getByText('Sprint 42')).toBeInTheDocument();
    expect(screen.getByText(/01\/10\/2026 → 15\/10\/2026/)).toBeInTheDocument();
  });

  it('lets the user choose multiple sprints', async () => {
    const user = userEvent.setup();
    const onSprintsChange = vi.fn();

    render(
      <SprintSummary
        sprint={mockSprint}
        sprints={mockSprints}
        selectedSprintValues={[sprintValue(mockSprint)]}
        userPoints={13}
        pulledCards={7}
        closedCards={4}
        onSprintsChange={onSprintsChange}
      />,
    );

    await user.click(screen.getByLabelText('Sprint'));
    await user.click(screen.getByRole('checkbox', { name: 'Sprint 41' }));

    expect(onSprintsChange).toHaveBeenCalledWith([
      sprintValue(mockSprint),
      sprintValue(mockPreviousSprint),
    ]);
    expect(screen.getByText('Pontos produzidos: 13')).toBeInTheDocument();
    expect(screen.getByText('Cards puxados: 7')).toBeInTheDocument();
    expect(screen.getByText('Cards fechados: 4')).toBeInTheDocument();
  });
});
