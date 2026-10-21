import { describe, expect, it, vi } from 'vitest';

import { mockWorkItems } from '@/services/azureDevOps/mock/mockData.ts';
import { createMockAzureDevOpsService } from '@/services/azureDevOps/mock/mockService.ts';
import { createWorkItemDetails } from '@/test/factories/workItem.ts';

describe('createMockAzureDevOpsService', () => {
  it('returns mock user, sprint and work items', async () => {
    const service = createMockAzureDevOpsService({ delayMs: 0 });

    await expect(service.getCurrentUser()).resolves.toMatchObject({
      displayName: 'Sophie Quines',
    });
    await expect(service.getCurrentSprint()).resolves.toMatchObject({
      name: 'Sprint 42',
    });
    await expect(service.getSprints()).resolves.toHaveLength(2);
    await expect(
      service.getUserWorkItems('sprint-42', 'sophie-quines'),
    ).resolves.toHaveLength(
      mockWorkItems.filter(
        (item) =>
          item.iterationPath.includes('Sprint 42') &&
          item.assignedTo === 'Sophie Quines',
      ).length,
    );
    await expect(
      service.getUserWorkItems('sprint-42', 'sophie-quines', { leadMode: true }),
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ title: 'Revisar contrato da API' }),
      ]),
    );
    await expect(
      service.getUserWorkItems('sprint-41', 'sophie-quines'),
    ).resolves.toMatchObject([{ title: 'Tarefa da sprint anterior' }]);
    await expect(service.getWorkItemDetails(12345)).resolves.toMatchObject({
      id: 12345,
      sprintName: 'Sprint 42',
    });
    const metrics = await service.getMetrics({
      scope: 'personal',
      period: 'current-sprint',
      sprintId: 'sprint-42',
    });
    expect(metrics.metrics?.kpis.find((kpi) => kpi.id === 'assigned')?.value).toBe(7);
    expect(metrics.vdm).toMatchObject({ objective: 7, closedInMonth: 2 });
    expect(metrics.sources.pullRequests).toBe('ok');
    const weekMetrics = await service.getMetrics({
      scope: 'personal',
      period: '7-days',
    });
    expect(weekMetrics.metrics?.kpis.find((kpi) => kpi.id === 'assigned')?.value).toBe(7);
    expect(weekMetrics.metrics?.items.some((item) => item.id === 12340)).toBe(false);
    await expect(
      service.getUserWorkItems(
        ['sprint-42', 'sprint-41'],
        'sophie-quines',
      ),
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ title: 'Corrigir autenticação' }),
        expect.objectContaining({ title: 'Tarefa da sprint anterior' }),
      ]),
    );
    await expect(
      service.createDeployCard({
        title: 'Deploy Sprint 42',
        description: 'Descrição',
        workItemIds: [12345],
      }),
    ).resolves.toMatchObject({
      id: 99999,
      title: 'Deploy Sprint 42',
    });
    await expect(service.listDeployCards('sprint-42')).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 88888, title: 'Deploy Sprint 42 (mock)' }),
      ]),
    );
    await expect(
      service.attachTasksToDeployCard(88888, {
        description: 'Descrição',
        workItemIds: [12345],
      }),
    ).resolves.toMatchObject({
      id: 88888,
      closedWorkItemIds: [12345],
    });
  });

  it('supports delay, failures, empty filters and custom details', async () => {
    vi.useFakeTimers();
    const delayed = createMockAzureDevOpsService({ delayMs: 10 });
    const pending = delayed.getCurrentUser();
    await vi.advanceTimersByTimeAsync(10);
    await expect(pending).resolves.toBeDefined();
    vi.useRealTimers();

    const failing = createMockAzureDevOpsService({
      delayMs: 0,
      failCurrentUser: true,
      failCurrentSprint: true,
      failWorkItems: true,
      failWorkItemDetails: true,
      failCreateDeployCard: true,
      failMetrics: true,
    });

    await expect(failing.getCurrentUser()).rejects.toThrow('usuário atual');
    await expect(failing.getCurrentSprint()).rejects.toThrow('Sprint atual');
    await expect(failing.getUserWorkItems('s', 'u')).rejects.toThrow(
      'itens de trabalho da Sprint',
    );
    await expect(failing.getWorkItemDetails(1)).rejects.toThrow('detalhes');
    await expect(
      failing.getMetrics({ scope: 'personal', period: 'current-sprint' }),
    ).rejects.toThrow('métricas');
    await expect(
      failing.createDeployCard({
        title: 'Deploy',
        description: 'Descrição',
        workItemIds: [1],
      }),
    ).rejects.toThrow('cartão de deploy');

    const custom = createMockAzureDevOpsService({
      delayMs: 0,
      detailsById: {
        7: createWorkItemDetails({ id: 7, title: 'Custom' }),
      },
    });

    await expect(custom.getUserWorkItems('', '')).resolves.toEqual([]);
    await expect(custom.getWorkItemDetails(7)).resolves.toMatchObject({
      title: 'Custom',
    });
    await expect(custom.getWorkItemDetails(999)).rejects.toThrow('#999');
  });
});
