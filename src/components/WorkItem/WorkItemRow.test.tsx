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

    expect(screen.getByLabelText('Bugs corrigidos')).toBeInTheDocument();
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

    expect(screen.getByText('#123 · Tarefa · Active')).toBeInTheDocument();
    expect(screen.getByLabelText('Sem pontos')).toBeInTheDocument();
    expect(screen.getByLabelText('Implantado: Não')).toBeInTheDocument();
    expect(screen.getByLabelText('PR de release: Não criada')).toBeInTheDocument();
  });

  it('shows the story points before the board column', () => {
    renderRow(createWorkItem({ storyPoints: 4 }));

    expect(screen.getByLabelText('Pontos: 4')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('shows the creation date when available', () => {
    renderRow(createWorkItem({ createdAt: '2026-10-04' }));

    expect(screen.getByLabelText('Criado em 04/10/2026')).toBeInTheDocument();
    expect(screen.getByText('04/10/2026')).toBeInTheDocument();
  });

  it('shows a fallback when the creation date is missing', () => {
    renderRow(createWorkItem({ createdAt: undefined }));

    expect(screen.getByLabelText('Data de criação indisponível')).toBeInTheDocument();
  });

  it('highlights work items blocked by the Azure blocked field', () => {
    renderRow(
      createWorkItem({
        title: 'Tarefa bloqueada',
        boardColumn: 'Em Desenvolvimento',
        blocked: true,
      }),
    );

    expect(
      screen.getByLabelText('Item de trabalho Tarefa bloqueada bloqueado'),
    ).toHaveAttribute('data-blocked', 'true');
    expect(screen.getByText('Bloqueado')).toBeInTheDocument();
  });

  it('highlights blocked work items in red', () => {
    renderRow(createWorkItem({ title: 'Tarefa bloqueada', boardColumn: 'Blocked' }));

    expect(screen.getByLabelText('Item de trabalho Tarefa bloqueada bloqueado')).toHaveAttribute(
      'data-blocked',
      'true',
    );
  });

  it('shows the deployed column when a main pull request exists', () => {
    renderRow(createWorkItem({ deployed: true }));

    expect(screen.getByLabelText('Implantado: Sim')).toBeInTheDocument();
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
