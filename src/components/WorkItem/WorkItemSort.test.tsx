import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { WorkItemSort } from '@/components/WorkItem/WorkItemSort.tsx';

describe('WorkItemSort', () => {
  it('changes the sort field', async () => {
    const user = userEvent.setup();
    const onSortByChange = vi.fn();

    render(
      <WorkItemSort
        sortBy="updatedAt"
        sortDirection="desc"
        onSortByChange={onSortByChange}
        onSortDirectionChange={vi.fn()}
      />,
    );

    await user.selectOptions(screen.getByLabelText('Ordenar'), 'title');

    expect(onSortByChange).toHaveBeenCalledWith('title');
  });

  it('toggles the sort direction', async () => {
    const user = userEvent.setup();
    const onSortDirectionChange = vi.fn();

    render(
      <WorkItemSort
        sortBy="title"
        sortDirection="asc"
        onSortByChange={vi.fn()}
        onSortDirectionChange={onSortDirectionChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: /ordenação crescente/i }));

    expect(onSortDirectionChange).toHaveBeenCalledWith('desc');
  });

  it('ignores unknown sort fields', () => {
    const onSortByChange = vi.fn();

    render(
      <WorkItemSort
        sortBy="id"
        sortDirection="desc"
        onSortByChange={onSortByChange}
        onSortDirectionChange={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText('Ordenar'), {
      target: { value: 'unknown' },
    });

    expect(onSortByChange).not.toHaveBeenCalled();
  });
});
