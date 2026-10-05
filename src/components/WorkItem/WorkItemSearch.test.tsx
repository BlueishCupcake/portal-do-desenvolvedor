import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { WorkItemSearch } from '@/components/WorkItem/WorkItemSearch.tsx';

describe('WorkItemSearch', () => {
  it('renders a labeled search field', () => {
    render(<WorkItemSearch value="" onChange={vi.fn()} />);

    expect(screen.getByLabelText('Buscar tarefa')).toBeInTheDocument();
  });

  it('notifies changes to the query', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<WorkItemSearch value="" onChange={onChange} />);
    await user.type(screen.getByLabelText('Buscar tarefa'), 'auth');

    expect(onChange).toHaveBeenCalled();
  });
});
