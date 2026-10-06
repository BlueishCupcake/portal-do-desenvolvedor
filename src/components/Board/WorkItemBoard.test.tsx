import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { WorkItemBoard } from '@/components/Board/WorkItemBoard.tsx';
import { createWorkItem } from '@/test/factories/workItem.ts';

describe('WorkItemBoard', () => {
  it('renders work item rows', () => {
    render(
      <WorkItemBoard
        workItems={[
          createWorkItem({ id: 1, title: 'Task A' }),
          createWorkItem({ id: 2, title: 'Task B', type: 'Bug' }),
        ]}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByText('Task A')).toBeInTheDocument();
    expect(screen.getByText('Task B')).toBeInTheDocument();
    expect(screen.getByLabelText('Bug')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Points' })).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'Release PR' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'Deployed' }),
    ).toBeInTheDocument();
    expect(screen.getAllByLabelText('Deployed: No').length).toBe(2);
    expect(screen.getAllByLabelText('Release PR: not created').length).toBe(2);
  });

  it('shows assignees in lead mode', () => {
    render(
      <WorkItemBoard
        workItems={[
          createWorkItem({ id: 1, title: 'Task A', assignedTo: 'Alex Santos' }),
        ]}
        leadMode
        onSelect={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('columnheader', { name: 'Responsável' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Alex Santos')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Selecionar todas as tarefas visíveis'),
    ).toBeEnabled();
    expect(
      screen.queryByRole('button', { name: 'Request PR creation' }),
    ).not.toBeInTheDocument();
  });

  it('requests a PR creation message for selected cards', async () => {
    const user = userEvent.setup();

    render(
      <WorkItemBoard
        leadMode
        workItems={[
          createWorkItem({
            id: 1,
            title: 'Task A',
            assignedTo: 'Alex Santos',
            url: 'https://dev.azure.com/item/1',
          }),
          createWorkItem({
            id: 2,
            title: 'Task B',
            assignedTo: 'Sophie Quines',
            url: 'https://dev.azure.com/item/2',
          }),
        ]}
        onSelect={vi.fn()}
      />,
    );

    await user.click(screen.getByLabelText('Selecionar Task A'));

    expect(
      screen.getByRole('button', { name: 'Request PR creation' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Create deploy card' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Request PR creation' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '#1 — Task A' })).toHaveAttribute(
      'href',
      'https://dev.azure.com/item/1',
    );
    expect(screen.getByText('Responsável: Alex Santos')).toBeInTheDocument();
    expect(screen.queryByText('Responsável: Sophie Quines')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Selecionar Task B')).toBeEnabled();
  });

  it('creates a deploy card from tasks assigned to different developers', async () => {
    const user = userEvent.setup();
    const onCreateDeployCard = vi.fn().mockResolvedValue({
      id: 120000,
      title: 'Deploy Sprint 42',
      url: 'https://dev.azure.com/item/120000',
    });

    render(
      <WorkItemBoard
        leadMode
        workItems={[
          createWorkItem({
            id: 1,
            title: 'Task A',
            assignedTo: 'Alex Santos',
          }),
          createWorkItem({
            id: 2,
            title: 'Task B',
            assignedTo: 'Sophie Quines',
            pullRequests: [
              {
                id: 99,
                repositoryName: 'api',
                projectName: 'portal',
                targetBranch: 'refs/heads/main',
              },
            ],
          }),
          createWorkItem({
            id: 3,
            title: 'Task C',
            assignedTo: 'Alex Santos',
          }),
        ]}
        onSelect={vi.fn()}
        onCreateDeployCard={onCreateDeployCard}
      />,
    );

    await user.click(screen.getByLabelText('Selecionar Task A'));
    await user.click(screen.getByLabelText('Selecionar Task B'));

    expect(
      screen.queryByRole('button', { name: 'Request PR creation' }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Create deploy card' }));
    await user.type(
      screen.getByRole('textbox', { name: 'Título' }),
      'Deploy Sprint 42',
    );
    expect(screen.getByText(/api \/ portal/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Criar cartão' }));

    expect(onCreateDeployCard).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Deploy Sprint 42',
        workItemIds: [1, 2],
      }),
    );
    expect(
      await screen.findByRole('link', {
        name: 'Abrir #120000 — Deploy Sprint 42',
      }),
    ).toHaveAttribute('href', 'https://dev.azure.com/item/120000');
  });

  it('shows bugs fixed when related bugs are resolved', () => {
    const task = createWorkItem({
      id: 1,
      title: 'Task with fixed bug',
      relatedIds: [2],
    });
    const bug = createWorkItem({
      id: 2,
      title: 'Resolved bug',
      type: 'Bug',
      state: 'Closed',
    });

    render(
      <WorkItemBoard workItems={[task]} catalog={[task, bug]} onSelect={vi.fn()} />,
    );

    expect(screen.getByLabelText('Bugs fixed')).toBeInTheDocument();
    expect(screen.getByText('Bugs fixed')).toBeInTheDocument();
  });
});
