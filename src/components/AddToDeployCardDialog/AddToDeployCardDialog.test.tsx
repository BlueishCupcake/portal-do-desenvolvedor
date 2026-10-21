import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AddToDeployCardDialog } from '@/components/AddToDeployCardDialog/AddToDeployCardDialog.tsx';
import { createWorkItem } from '@/test/factories/workItem.ts';

const deployCards = [
  {
    id: 88888,
    title: 'Deploy mock',
    url: 'https://dev.azure.com/mock/88888',
    state: 'Active',
    iterationPath: 'Sprint 42',
  },
];

describe('AddToDeployCardDialog', () => {
  it('attaches selected tasks to a deploy card', async () => {
    const user = userEvent.setup();
    const onAttach = vi.fn().mockResolvedValue({
      id: 88888,
      title: 'Deploy mock',
      url: 'https://dev.azure.com/mock/88888',
      attachedWorkItemIds: [1],
      closedWorkItemIds: [1],
    });
    const onAttached = vi.fn();

    render(
      <AddToDeployCardDialog
        open
        workItems={[createWorkItem({ id: 1, title: 'Task A' })]}
        catalog={[createWorkItem({ id: 1, title: 'Task A' })]}
        deployCards={deployCards}
        isLoadingDeployCards={false}
        deployCardsError={null}
        onLoadDeployCardRelatedIds={vi.fn().mockResolvedValue([])}
        onAttach={onAttach}
        onClose={vi.fn()}
        onAttached={onAttached}
      />,
    );

    await user.selectOptions(
      screen.getByLabelText('Cartão de deploy'),
      '88888',
    );
    await user.click(screen.getByRole('button', { name: 'Adicionar ao cartão' }));

    await waitFor(() => {
      expect(onAttach).toHaveBeenCalledWith(
        88888,
        expect.objectContaining({ workItemIds: [1] }),
      );
    });
    expect(onAttached).toHaveBeenCalled();
    expect(
      screen.getByText('Tarefas adicionadas ao cartão de deploy com sucesso.'),
    ).toBeInTheDocument();
  });

  it('shows empty state when there are no deploy cards', () => {
    render(
      <AddToDeployCardDialog
        open
        workItems={[createWorkItem({ id: 1, title: 'Task A' })]}
        catalog={[]}
        deployCards={[]}
        isLoadingDeployCards={false}
        deployCardsError={null}
        onLoadDeployCardRelatedIds={vi.fn()}
        onAttach={vi.fn()}
        onClose={vi.fn()}
        onAttached={vi.fn()}
      />,
    );

    expect(
      screen.getByText('Nenhum item de trabalho nesta Sprint.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Adicionar ao cartão' }),
    ).toBeDisabled();
  });

  it('shows error when attach fails and cancel does not attach', async () => {
    const user = userEvent.setup();
    const onAttach = vi.fn().mockRejectedValue(new Error('Falha no Azure'));
    const onClose = vi.fn();

    render(
      <AddToDeployCardDialog
        open
        workItems={[createWorkItem({ id: 1, title: 'Task A' })]}
        catalog={[createWorkItem({ id: 1, title: 'Task A' })]}
        deployCards={deployCards}
        isLoadingDeployCards={false}
        deployCardsError={null}
        onLoadDeployCardRelatedIds={vi.fn().mockResolvedValue([])}
        onAttach={onAttach}
        onClose={onClose}
        onAttached={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onClose).toHaveBeenCalled();
    expect(onAttach).not.toHaveBeenCalled();

    await user.selectOptions(
      screen.getByLabelText('Cartão de deploy'),
      '88888',
    );
    await user.click(screen.getByRole('button', { name: 'Adicionar ao cartão' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Falha no Azure');
  });
});
