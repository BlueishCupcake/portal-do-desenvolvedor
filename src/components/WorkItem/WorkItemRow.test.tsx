import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { WorkItemRow } from '@/components/WorkItem/WorkItemRow.tsx';
import { createWorkItem } from '@/test/factories/workItem.ts';

function renderRow(
  workItem: ReturnType<typeof createWorkItem>,
  onSelect = vi.fn(),
) {
  return render(
    <table>
      <tbody>
        <WorkItemRow workItem={workItem} onSelect={onSelect} />
      </tbody>
    </table>,
  );
}

describe('WorkItemRow', () => {
  it('should render the work item title', () => {
    renderRow(createWorkItem({ title: 'Implement new filter' }));

    expect(screen.getByText('Implement new filter')).toBeInTheDocument();
  });

  it('should show bug indicator for bug work items', () => {
    renderRow(
      createWorkItem({
        title: 'Fix authentication',
        type: 'Bug',
      }),
    );

    expect(screen.getByLabelText('Bug')).toBeInTheDocument();
  });

  it('shows bugs fixed for resolved bugs', () => {
    renderRow(
      createWorkItem({
        title: 'Fix authentication',
        type: 'Bug',
        state: 'Closed',
      }),
    );

    expect(screen.getByLabelText('Bugs fixed')).toBeInTheDocument();
  });

  it('calls onSelect when the title is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    renderRow(createWorkItem({ id: 123 }), onSelect);

    await user.click(screen.getByRole('button', { name: 'Implement new filter' }));

    expect(onSelect).toHaveBeenCalledWith(123);
  });

  it('renders work items without optional fields', () => {
    renderRow(
      createWorkItem({
        description: undefined,
        url: undefined,
        priority: undefined,
      }),
    );

    expect(screen.getByText('#123 · Task · Active')).toBeInTheDocument();
    expect(screen.getByLabelText('Deployed: No')).toBeInTheDocument();
    expect(screen.getByLabelText('Release PR: not created')).toBeInTheDocument();
  });

  it('shows the deployed column when a main pull request exists', () => {
    renderRow(createWorkItem({ deployed: true }));

    expect(screen.getByLabelText('Deployed: Yes')).toBeInTheDocument();
  });

  it('shows the assignee in lead mode', () => {
    render(
      <table>
        <tbody>
          <WorkItemRow
            workItem={createWorkItem({ assignedTo: 'Alex Santos' })}
            leadMode
            onSelect={vi.fn()}
          />
        </tbody>
      </table>,
    );

    expect(screen.getByText('Alex Santos')).toBeInTheDocument();
    expect(screen.getByLabelText('Selecionar Implement new filter')).toBeEnabled();
  });

  it('disables the checkbox when the task belongs to another developer', () => {
    render(
      <table>
        <tbody>
          <WorkItemRow
            workItem={createWorkItem({ assignedTo: 'Alex Santos' })}
            leadMode
            selectDisabled
            onSelect={vi.fn()}
          />
        </tbody>
      </table>,
    );

    expect(screen.getByLabelText('Selecionar Implement new filter')).toBeDisabled();
  });
});
