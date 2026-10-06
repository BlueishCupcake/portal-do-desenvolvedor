import { afterEach, describe, expect, it, vi } from 'vitest';

import { createRestAzureDevOpsService } from '@/services/azureDevOps/rest/restService.ts';
import { AzureDevOpsError } from '@/services/azureDevOps/types.ts';

const azureItem = {
  id: 88,
  url: 'https://dev.azure.com/contoso/portal/_workitems/edit/88',
  fields: {
    'System.Title': 'Tarefa REST',
    'System.WorkItemType': 'Task',
    'System.State': 'Active',
    'System.AssignedTo': { displayName: 'Sophie' },
    'System.BoardColumn': 'Doing',
    'System.IterationPath': 'Portal\\Sprint 42',
    'System.CreatedDate': '2026-10-01',
    'System.ChangedDate': '2026-10-04',
  },
};

describe('createRestAzureDevOpsService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('maps proxied Azure DevOps responses', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.endsWith('/me')) {
        return {
          ok: true,
          json: async () => ({ displayName: 'Sophie', id: 'u1' }),
        };
      }

      if (url.endsWith('/sprint/current')) {
        return {
          ok: true,
          json: async () => ({
            id: 's42',
            name: 'Sprint 42',
            path: 'Portal\\Sprint 42',
            attributes: { startDate: '2026-10-01', finishDate: '2026-10-15' },
          }),
        };
      }

      if (url.endsWith('/sprints')) {
        return {
          ok: true,
          json: async () => ({
            value: [
              {
                id: 's42',
                name: 'Sprint 42',
                path: 'Portal\\Sprint 42',
                attributes: { startDate: '2026-10-01', finishDate: '2026-10-15' },
              },
            ],
          }),
        };
      }

      if (url.endsWith('/pipelines')) {
        return {
          ok: true,
          json: async () => ({
            value: [
              {
                id: 501,
                buildNumber: '20261006.4',
                status: 'inProgress',
                definition: { name: 'portal-ci' },
                requestedFor: { displayName: 'Sophie' },
                sourceBranch: 'refs/heads/main',
                queueTime: '2026-10-06T14:00:00Z',
                _links: {
                  web: {
                    href: 'https://dev.azure.com/contoso/portal/_build/results?buildId=501',
                  },
                },
              },
            ],
          }),
        };
      }

      if (url.includes('/work-items?')) {
        return {
          ok: true,
          json: async () => ({ value: [azureItem] }),
        };
      }

      if (url.endsWith('/deploy-cards')) {
        expect(init?.method).toBe('POST');
        expect(JSON.parse(String(init?.body))).toMatchObject({
          title: 'Deploy Sprint 42',
          workItemIds: [88],
        });
        return {
          ok: true,
          json: async () => ({
            id: 120000,
            url: 'https://dev.azure.com/contoso/portal/_workitems/edit/120000',
            fields: { 'System.Title': 'Deploy Sprint 42' },
          }),
        };
      }

      return {
        ok: true,
        json: async () => azureItem,
      };
    });

    vi.stubGlobal('fetch', fetchMock);
    const service = createRestAzureDevOpsService();

    await expect(service.getCurrentUser()).resolves.toMatchObject({
      displayName: 'Sophie',
    });
    await expect(service.getCurrentSprint()).resolves.toMatchObject({
      name: 'Sprint 42',
    });
    await expect(service.getSprints()).resolves.toMatchObject([
      { name: 'Sprint 42' },
    ]);
    await expect(service.getUserPipelines()).resolves.toMatchObject([
      { id: 501, name: 'portal-ci', status: 'inProgress' },
    ]);
    await expect(
      service.getUserWorkItems('Portal\\Sprint 42', 'u1'),
    ).resolves.toMatchObject([{ id: 88, title: 'Tarefa REST' }]);
    await expect(service.getWorkItemDetails(88)).resolves.toMatchObject({
      sprintName: 'Sprint 42',
    });
    await expect(
      service.createDeployCard({
        title: 'Deploy Sprint 42',
        description: 'Aplicações afetadas:',
        workItemIds: [88],
      }),
    ).resolves.toMatchObject({
      id: 120000,
      title: 'Deploy Sprint 42',
    });
  });

  it('surfaces API errors from the proxy', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ message: 'PAT inválido' }),
      }),
    );

    const service = createRestAzureDevOpsService();

    await expect(service.getCurrentUser()).rejects.toBeInstanceOf(AzureDevOpsError);
    await expect(service.getCurrentUser()).rejects.toThrow('PAT inválido');
  });

  it('uses a fallback message when the proxy body is empty', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => {
          throw new Error('no json');
        },
      }),
    );

    await expect(createRestAzureDevOpsService().getCurrentUser()).rejects.toThrow(
      'Não foi possível comunicar com o Azure DevOps.',
    );
  });
});
