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
    });

    await expect(failing.getCurrentUser()).rejects.toThrow('usuário atual');
    await expect(failing.getCurrentSprint()).rejects.toThrow('Sprint atual');
    await expect(failing.getUserWorkItems('s', 'u')).rejects.toThrow('work items');
    await expect(failing.getWorkItemDetails(1)).rejects.toThrow('detalhes');

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
