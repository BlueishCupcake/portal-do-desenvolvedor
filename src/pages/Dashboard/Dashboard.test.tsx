import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { App } from '@/app/App.tsx';
import { createMockAzureDevOpsService } from '@/services/azureDevOps/mock/mockService.ts';
import { createWorkItem } from '@/test/factories/workItem.ts';
import { renderWithProviders } from '@/test/render.tsx';

describe('Dashboard', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.stubEnv('VITE_AZURE_DEVOPS_PROVIDER', 'mock');
  });

  it('loads the current user, sprint and work items', async () => {
    renderWithProviders(<App />);

    expect(await screen.findByText('Sophie Quines')).toBeInTheDocument();
    expect(screen.getByLabelText('Sprint')).toHaveTextContent('Sprint 42');
    expect(await screen.findByText('Corrigir autenticação')).toBeInTheDocument();
    expect(screen.getByLabelText('Pontos do usuário na sprint: 28')).toBeInTheDocument();
    expect(screen.getByLabelText('Cards puxados na sprint: 6')).toBeInTheDocument();
    expect(screen.getByLabelText('Cards fechados na sprint: 2')).toBeInTheDocument();
    expect(screen.getAllByLabelText(/bug/i).length).toBeGreaterThan(0);
  });

  it('shows a loading skeleton while data is fetched', () => {
    renderWithProviders(<App />, {
      service: createMockAzureDevOpsService({ delayMs: 50 }),
    });

    expect(screen.getByLabelText('Carregando tarefas')).toBeInTheDocument();
  });

  it('shows an error state and retries', async () => {
    const user = userEvent.setup();
    const service = createMockAzureDevOpsService({
      delayMs: 0,
      failCurrentSprint: true,
    });

    renderWithProviders(<App />, { service });

    expect(
      await screen.findByText('Não foi possível identificar a Sprint atual.'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(
      await screen.findByText('Não foi possível identificar a Sprint atual.'),
    ).toBeInTheDocument();
  });

  it('shows an empty state when the user has no work items', async () => {
    renderWithProviders(<App />, {
      service: createMockAzureDevOpsService({ delayMs: 0, workItems: [] }),
    });

    expect(await screen.findByText('Nenhuma tarefa encontrada')).toBeInTheDocument();
  });

  it('filters, searches and sorts without a new request', async () => {
    const user = userEvent.setup();
    const service = createMockAzureDevOpsService({ delayMs: 0 });
    const getUserWorkItems = service.getUserWorkItems.bind(service);
    let requestCount = 0;
    service.getUserWorkItems = async (sprintId, userId) => {
      requestCount += 1;
      return getUserWorkItems(sprintId, userId);
    };

    renderWithProviders(<App />, { service });

    expect(await screen.findByText('Corrigir autenticação')).toBeInTheDocument();
    expect(requestCount).toBe(1);

    await user.click(screen.getByRole('button', { name: 'Bugs' }));
    expect(screen.getByText('Corrigir autenticação')).toBeInTheDocument();
    expect(screen.queryByText('Implementar filtro')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Todos' }));
    await user.type(screen.getByLabelText('Buscar tarefa'), '12346');
    expect(screen.getByText('Implementar filtro')).toBeInTheDocument();
    expect(screen.queryByText('Corrigir autenticação')).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText('Buscar tarefa'));
    await user.selectOptions(screen.getByLabelText('Coluna do board'), 'Done');
    expect(screen.getByText('Criar componente')).toBeInTheDocument();
    expect(screen.queryByText('Corrigir autenticação')).not.toBeInTheDocument();

    await user.selectOptions(
      screen.getByLabelText('Coluna do board'),
      'Todas as colunas do board',
    );
    await user.selectOptions(
      screen.getByLabelText('Status do item'),
      'Resolved',
    );
    expect(screen.getByText('Criar componente')).toBeInTheDocument();

    expect(requestCount).toBe(1);
  }, 15_000);

  it('shows a filtered empty state', async () => {
    const user = userEvent.setup();

    renderWithProviders(<App />);
    expect(await screen.findByText('Corrigir autenticação')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Buscar tarefa'), 'item-inexistente');

    expect(screen.getByText('Nenhum resultado encontrado')).toBeInTheDocument();
  });

  it('opens and closes work item details', async () => {
    const user = userEvent.setup();

    renderWithProviders(<App />);
    await user.click(
      await screen.findByRole('button', { name: 'Implementar filtro' }),
    );

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('#12346')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Abrir no Azure DevOps' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Fechar' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('handles work item details errors', async () => {
    const user = userEvent.setup();

    renderWithProviders(<App />, {
      service: createMockAzureDevOpsService({
        delayMs: 0,
        failWorkItemDetails: true,
      }),
    });

    await user.click(
      await screen.findByRole('button', { name: 'Corrigir autenticação' }),
    );

    expect(
      await screen.findByText('Não foi possível carregar os detalhes do work item.'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(
      await screen.findByText('Não foi possível carregar os detalhes do work item.'),
    ).toBeInTheDocument();
  });

  it('loads work items from the selected sprint', async () => {
    const user = userEvent.setup();

    renderWithProviders(<App />);

    expect(await screen.findByText('Corrigir autenticação')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Sprint'));
    await user.click(screen.getByRole('checkbox', { name: 'Sprint 41' }));
    await user.click(screen.getByRole('checkbox', { name: 'Sprint 42' }));

    expect(await screen.findByText('Tarefa da sprint anterior')).toBeInTheDocument();
    expect(screen.getByLabelText('Pontos do usuário na sprint: 3')).toBeInTheDocument();
    expect(screen.queryByText('Corrigir autenticação')).not.toBeInTheDocument();
  });

  it('loads work items from multiple selected sprints', async () => {
    const user = userEvent.setup();

    renderWithProviders(<App />);

    expect(await screen.findByText('Corrigir autenticação')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Sprint'));
    await user.click(screen.getByRole('checkbox', { name: 'Sprint 41' }));

    expect(await screen.findByText('Tarefa da sprint anterior')).toBeInTheDocument();
    expect(screen.getByText('Corrigir autenticação')).toBeInTheDocument();
    expect(screen.getByLabelText('Sprint')).toHaveTextContent('2 sprints selecionadas');
  });

  it('shows every sprint work item and assignees in lead mode', async () => {
    const user = userEvent.setup();

    renderWithProviders(<App />);

    expect(await screen.findByText('Corrigir autenticação')).toBeInTheDocument();
    expect(screen.queryByText('Revisar contrato da API')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Ativar Lead Mode' }));

    expect(await screen.findByText('Revisar contrato da API')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Responsável' })).toBeInTheDocument();
    expect(screen.getAllByText('Sophie Quines').length).toBeGreaterThan(1);
    expect(screen.getAllByText('Alex Santos').length).toBeGreaterThan(1);
    expect(screen.getByLabelText('Pontos do usuário na sprint: 28')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Selecionar Revisar contrato da API'));
    await user.click(screen.getByRole('button', { name: 'Request PR creation' }));

    expect(screen.getByRole('dialog', { name: /solicitar criação de pr/i })).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Revisar contrato da API/ }),
    ).toBeInTheDocument();
  });

  it('opens the To Do\'s board from the header tabs', async () => {
    const user = userEvent.setup();

    renderWithProviders(<App />);

    expect(await screen.findByText('Corrigir autenticação')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: "To Do's" }));

    expect(screen.queryByText('Corrigir autenticação')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: "To Do's" })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Novo post-it' })).toBeInTheDocument();
    expect(screen.getByTitle('0 post-its')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Novo post-it' }));

    expect(await screen.findByTitle('1 post-it')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Tasks' }));

    expect(await screen.findByText('Corrigir autenticação')).toBeInTheDocument();
  });

  it('opens the Metrics tab immediately beside Pipelines', async () => {
    const user = userEvent.setup();

    renderWithProviders(<App />);

    const pipelinesTab = screen.getByRole('tab', { name: 'Pipelines' });
    const metricsTab = screen.getByRole('tab', { name: 'Metrics' });
    expect(pipelinesTab.compareDocumentPosition(metricsTab)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );

    await user.click(metricsTab);

    expect(await screen.findByRole('heading', { name: 'Metrics' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'My Metrics' })).toBeInTheDocument();
    expect(
      await screen.findByRole('button', { name: /Atribuídos a mim: 7/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('VDM Objective 7 / Current closed cards: 2'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Corrigir autenticação')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Pipelines' }));
    expect(await screen.findByRole('heading', { name: 'Pipelines' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Metrics' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Tasks' }));
    expect(await screen.findByText('Corrigir autenticação')).toBeInTheDocument();
  });

  it('opens pipelines requested for the current user', async () => {
    const user = userEvent.setup();

    renderWithProviders(<App />);

    await user.click(screen.getByRole('tab', { name: 'Pipelines' }));

    expect(
      await screen.findByRole('heading', { name: 'Pipelines' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'portal-ci' })).toBeInTheDocument();
    expect(screen.getByLabelText('Pipeline: Em execução')).toBeInTheDocument();
  });

  it('renders work items without optional information', async () => {
    renderWithProviders(<App />, {
      service: createMockAzureDevOpsService({
        delayMs: 0,
        workItems: [
          createWorkItem({
            id: 99,
            title: 'Item mínimo',
            description: undefined,
            url: undefined,
            priority: undefined,
            createdAt: undefined,
            updatedAt: undefined,
          }),
        ],
      }),
    });

    expect(await screen.findByText('Item mínimo')).toBeInTheDocument();
  });
});
