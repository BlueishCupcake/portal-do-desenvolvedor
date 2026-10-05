import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SprintSummary } from '@/components/Sprint/SprintSummary.tsx';
import {
  mockPreviousSprint,
  mockSprint,
  mockSprints,
} from '@/services/azureDevOps/mock/mockData.ts';

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

  it('lets the user choose another sprint', async () => {
    const user = userEvent.setup();
    const onSprintChange = vi.fn();

    render(
      <SprintSummary
        sprint={mockSprint}
        sprints={mockSprints}
        onSprintChange={onSprintChange}
      />,
    );

    await user.selectOptions(
      screen.getByLabelText('Sprint'),
      mockPreviousSprint.path,
    );

    expect(onSprintChange).toHaveBeenCalledWith(mockPreviousSprint.path);
  });
});
