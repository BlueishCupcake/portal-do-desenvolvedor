import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { MetricsBoard } from '@/components/Metrics/MetricsBoard.tsx';
import { createMockAzureDevOpsService } from '@/services/azureDevOps/mock/mockService.ts';
import { renderWithProviders } from '@/test/render.tsx';

describe('MetricsBoard', () => {
  it('shows a loading state while metrics are fetched', () => {
    renderWithProviders(<MetricsBoard />, {
      service: createMockAzureDevOpsService({ delayMs: 50 }),
    });

    expect(screen.getByLabelText('Carregando métricas')).toBeInTheDocument();
  });

  it('renders personal KPIs, context and the work item table', async () => {
    renderWithProviders(<MetricsBoard />);

    expect(await screen.findByRole('heading', { name: 'Metrics' })).toBeInTheDocument();
    expect(
      await screen.findByRole('button', { name: /Atribuídos a mim: 7/ }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Projeto: portal/)).toBeInTheDocument();
    expect(screen.getByText(/Time: devs/)).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'My Metrics' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('button', { name: /Ativos: 5/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Bugs: 2/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /PRs: 3/ })).toBeInTheDocument();
    expect(
      screen.getByLabelText('VDM Objective 7 / Current closed cards: 2'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Tendências históricas exigem Azure DevOps Analytics/),
    ).toBeInTheDocument();
    expect(screen.getByText('Corrigir autenticação')).toBeInTheDocument();
  });

  it('filters the table when a KPI is selected and clears it on a second click', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MetricsBoard />);

    await user.click(await screen.findByRole('button', { name: /Bugs: 2/ }));

    expect(screen.getByText('Corrigir autenticação')).toBeInTheDocument();
    expect(screen.queryByText('Implementar filtro')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Bugs: 2/ }));
    expect(screen.getByText('Implementar filtro')).toBeInTheDocument();
  });

  it('switches to team metrics and keeps the period selector', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MetricsBoard />);

    await user.click(await screen.findByRole('tab', { name: 'Team Metrics' }));

    expect(
      await screen.findByRole('button', { name: /Sem responsável: 1/ }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Progresso da sprint/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Atribuídos a mim/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Project Metrics' }));
    expect(await screen.findByRole('tab', { name: 'Project Metrics' })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    await user.selectOptions(screen.getByLabelText('Período'), '7 dias');
    expect(await screen.findByLabelText('Período')).toHaveValue('7-days');
    await user.selectOptions(screen.getByLabelText('Período'), '90 dias');
    expect(screen.getByLabelText('Período')).toHaveValue('90-days');
  });

  it('keeps the scope tabs available in dark mode', async () => {
    document.documentElement.setAttribute('data-theme', 'dark');
    renderWithProviders(<MetricsBoard />);

    expect(await screen.findByRole('tab', { name: 'My Metrics' })).toBeVisible();
    expect(screen.getByRole('tab', { name: 'Team Metrics' })).toBeVisible();
    expect(screen.getByRole('tab', { name: 'Project Metrics' })).toBeVisible();
  });

  it('shows partial data without converting failed sources into zeros', async () => {
    renderWithProviders(<MetricsBoard />, {
      service: createMockAzureDevOpsService({
        delayMs: 0,
        failPullRequests: true,
        failPipelines: true,
      }),
    });

    expect(await screen.findByText(/Dados parciais/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /PRs:/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Pipelines:/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Atribuídos a mim: 7/ })).toBeInTheDocument();
  });

  it('shows an empty state when no work items match', async () => {
    renderWithProviders(<MetricsBoard />, {
      service: createMockAzureDevOpsService({ delayMs: 0, workItems: [] }),
    });

    expect(await screen.findByText('Nenhum work item encontrado')).toBeInTheDocument();
  });

  it('shows an error state and retries', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MetricsBoard />, {
      service: createMockAzureDevOpsService({ delayMs: 0, failMetrics: true }),
    });

    expect(
      await screen.findByText('Não foi possível carregar as métricas.'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(
      screen.getByText('Não foi possível carregar as métricas.'),
    ).toBeInTheDocument();
  });

  it('refreshes the current query without changing filters', async () => {
    const user = userEvent.setup();
    const service = createMockAzureDevOpsService({ delayMs: 0 });
    const getMetrics = service.getMetrics.bind(service);
    let requests = 0;
    service.getMetrics = async (query) => {
      requests += 1;
      return getMetrics(query);
    };

    renderWithProviders(<MetricsBoard />, { service });

    await screen.findByRole('button', { name: /Atribuídos a mim: 7/ });
    expect(requests).toBe(1);

    await user.click(screen.getByRole('button', { name: 'Atualizar' }));
    expect(await screen.findByRole('button', { name: /Atribuídos a mim: 7/ })).toBeInTheDocument();
    expect(requests).toBe(2);
  });
});
