import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { PipelinesBoard } from '@/components/Pipelines/PipelinesBoard.tsx';
import { mockPipelines } from '@/services/azureDevOps/mock/mockData.ts';

const notifications = {
  supported: true,
  enabled: false,
  permission: 'default' as NotificationPermission,
  requestPermission: vi.fn(async () => {}),
  disable: vi.fn(),
};

describe('PipelinesBoard', () => {
  it('lists running and completed pipelines with Azure links', () => {
    render(
      <PipelinesBoard
        runs={mockPipelines}
        isLoading={false}
        errorMessage={null}
        notifications={notifications}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByRole('link', { name: 'portal-ci' })).toHaveAttribute(
      'href',
      expect.stringContaining('buildId=501'),
    );
    expect(screen.getByLabelText('Pipeline: Em execução')).toBeInTheDocument();
    expect(screen.getByLabelText('Pipeline: Sucesso')).toBeInTheDocument();
    expect(screen.getByText('feature/pipelines')).toBeInTheDocument();
  });

  it('renders loading, empty and error states', async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(
      <PipelinesBoard
        runs={[]}
        isLoading
        errorMessage={null}
        notifications={notifications}
        onRetry={onRetry}
      />,
    );

    expect(screen.getByLabelText('Carregando pipelines')).toBeInTheDocument();

    rerender(
      <PipelinesBoard
        runs={[]}
        isLoading={false}
        errorMessage="PAT sem permissão"
        notifications={notifications}
        onRetry={onRetry}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(onRetry).toHaveBeenCalledOnce();

    rerender(
      <PipelinesBoard
        runs={[]}
        isLoading={false}
        errorMessage={null}
        notifications={notifications}
        onRetry={onRetry}
      />,
    );
    expect(screen.getByText('Nenhuma pipeline encontrada')).toBeInTheDocument();
  });

  it('requests permission from the notification button', async () => {
    const user = userEvent.setup();
    const requestPermission = vi.fn(async () => {});

    render(
      <PipelinesBoard
        runs={mockPipelines}
        isLoading={false}
        errorMessage={null}
        notifications={{ ...notifications, requestPermission }}
        onRetry={vi.fn()}
      />,
    );

    await user.click(
      screen.getByRole('button', { name: 'Ativar notificações' }),
    );

    expect(requestPermission).toHaveBeenCalledOnce();
  });
});
