import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { WorkItemDetails } from '@/components/WorkItemDetails/WorkItemDetails.tsx';
import { createWorkItemDetails } from '@/test/factories/workItem.ts';

describe('WorkItemDetails', () => {
  it('does not render when closed', () => {
    render(
      <WorkItemDetails
        isOpen={false}
        details={null}
        isLoading={false}
        errorMessage={null}
        onClose={vi.fn()}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders details and an Azure DevOps link', () => {
    render(
      <WorkItemDetails
        isOpen
        details={createWorkItemDetails({
          title: 'Implementar filtro por disciplina',
          url: 'https://dev.azure.com/item/123',
          description: 'Implementar filtro de disciplinas...',
        })}
        isLoading={false}
        errorMessage={null}
        onClose={vi.fn()}
        onRetry={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('heading', { name: 'Implementar filtro por disciplina' }),
    ).toBeInTheDocument();
    expect(screen.getByText('#123')).toBeInTheDocument();
    expect(screen.getByText('Release PR')).toBeInTheDocument();
    expect(screen.getByLabelText('Release PR: not created')).toBeInTheDocument();
    expect(screen.getByText('Deployed')).toBeInTheDocument();
    expect(screen.getByLabelText('Deployed: No')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Abrir no Azure DevOps' }),
    ).toHaveAttribute('href', 'https://dev.azure.com/item/123');
  });

  it('renders loading and error states', () => {
    const { rerender } = render(
      <WorkItemDetails
        isOpen
        details={null}
        isLoading
        errorMessage={null}
        onClose={vi.fn()}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Carregando tarefas')).toBeInTheDocument();

    rerender(
      <WorkItemDetails
        isOpen
        details={null}
        isLoading={false}
        errorMessage="Falha ao carregar"
        onClose={vi.fn()}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByText('Falha ao carregar')).toBeInTheDocument();
  });

  it('closes on escape and close button', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <WorkItemDetails
        isOpen
        details={createWorkItemDetails({
          description: undefined,
          url: undefined,
          createdAt: '',
          updatedAt: '',
        })}
        isLoading={false}
        errorMessage={null}
        onClose={onClose}
        onRetry={vi.fn()}
      />,
    );

    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', { name: 'Fechar' }));

    expect(onClose).toHaveBeenCalledTimes(2);
    expect(screen.getByText('Nenhuma descrição disponível.')).toBeInTheDocument();
  });

  it('retries when details fail', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    render(
      <WorkItemDetails
        isOpen
        details={null}
        isLoading={false}
        errorMessage="Erro"
        onClose={vi.fn()}
        onRetry={onRetry}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
