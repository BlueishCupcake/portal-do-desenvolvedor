import { afterEach, describe, expect, it, vi } from 'vitest';

import { handleAzureDevOpsApi } from './handlers.ts';

const env = {
  VITE_AZURE_DEVOPS_ORGANIZATION: 'contoso',
  VITE_AZURE_DEVOPS_PROJECT: 'portal',
  VITE_AZURE_DEVOPS_TEAM: 'devs',
  AZURE_DEVOPS_PAT: 'secret',
  AZURE_DEVOPS_PIPELINE_PROJECT: 'pipelines-project',
  AZURE_DEVOPS_PIPELINE_DEFINITION_IDS: '690,1132',
};

describe('azure devops api handlers', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns 503 when the server is not configured', async () => {
    const result = await handleAzureDevOpsApi(
      'GET',
      '/api/azure-devops/me',
      new URLSearchParams(),
      {},
    );

    expect(result.status).toBe(503);
  });

  it('rejects unsupported methods and unknown routes', async () => {
    await expect(
      handleAzureDevOpsApi(
        'POST',
        '/api/azure-devops/me',
        new URLSearchParams(),
        env,
      ),
    ).resolves.toMatchObject({ status: 405 });

    await expect(
      handleAzureDevOpsApi(
        'GET',
        '/api/azure-devops/unknown',
        new URLSearchParams(),
        env,
      ),
    ).resolves.toMatchObject({ status: 404 });
  });

  it('creates a deploy card linked to the selected work items', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      expect(url).toContain('/_apis/wit/workitems/$Task');
      expect(init?.method).toBe('POST');
      expect(init?.headers).toMatchObject({
        'Content-Type': 'application/json-patch+json',
      });
      expect(JSON.parse(String(init?.body))).toEqual(
        expect.arrayContaining([
          {
            op: 'add',
            path: '/fields/System.Title',
            value: 'Deploy Sprint 42',
          },
          {
            op: 'add',
            path: '/fields/System.Description',
            value:
              'Stories/Features:<br><a href="https://dev.azure.com/items/61407?x=1&amp;y=2">USER STORY 61407: Ajustar API</a>',
          },
          expect.objectContaining({
            op: 'add',
            path: '/relations/-',
            value: expect.objectContaining({
              rel: 'System.LinkTypes.Related',
              url: expect.stringContaining('/workItems/61407'),
            }),
          }),
        ]),
      );

      return {
        ok: true,
        json: async () => ({
          id: 120000,
          fields: {
            'System.Title': 'Deploy Sprint 42',
            'System.WorkItemType': 'Task',
            'System.State': 'New',
            'System.IterationPath': 'Portal\\Sprint 42',
          },
        }),
      };
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      handleAzureDevOpsApi(
        'POST',
        '/api/azure-devops/deploy-cards',
        new URLSearchParams(),
        env,
        {
          title: 'Deploy Sprint 42',
          description:
            'Stories/Features:\n[USER STORY 61407: Ajustar API](https://dev.azure.com/items/61407?x=1&y=2)',
          workItemIds: [61407, 61408],
          iterationPath: 'Portal\\Sprint 42',
        },
      ),
    ).resolves.toMatchObject({
      status: 201,
      body: {
        id: 120000,
        url: 'https://dev.azure.com/contoso/portal/_workitems/edit/120000',
      },
    });
  });

  it('validates deploy card input before calling Azure DevOps', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      handleAzureDevOpsApi(
        'POST',
        '/api/azure-devops/deploy-cards',
        new URLSearchParams(),
        env,
        { title: '', description: '', workItemIds: [] },
      ),
    ).resolves.toMatchObject({
      status: 400,
      body: { message: expect.stringContaining('título') },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('loads the current user, sprint and assigned work items', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.includes('/_apis/profile/profiles/me')) {
        return {
          ok: true,
          json: async () => ({
            displayName: 'Sophie Quines Mendonca',
            emailAddress: 'sophie@contoso.com',
          }),
        };
      }

      if (url.includes('connectionData')) {
        return {
          ok: true,
          json: async () => ({
            authenticatedUser: {
              id: 'u1',
              providerDisplayName: 'Sophie Quines',
              properties: { Account: { $value: 'sophie@contoso.com' } },
            },
          }),
        };
      }

      if (url.includes('iterations')) {
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

      if (url.includes('wiql')) {
        expect(init?.method).toBe('POST');
        return {
          ok: true,
          json: async () => ({ workItems: [{ id: 88 }] }),
        };
      }

      if (url.includes('/_apis/build/builds')) {
        expect(url).toContain('/pipelines-project/_apis/build/builds');
        expect(url).toContain('requestedFor=u1');
        expect(url).toContain('definitions=690%2C1132');
        expect(url).toContain('statusFilter=all');
        return {
          ok: true,
          json: async () => ({
            value: [
              {
                id: 501,
                buildNumber: '20261006.4',
                status: 'inProgress',
                definition: { name: 'portal-ci' },
                requestedFor: { displayName: 'Sophie Quines' },
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

      const workItem = {
        id: 88,
        fields: {
          'System.Title': 'Tarefa real',
          'System.WorkItemType': 'Task',
          'System.State': 'Active',
          'System.IterationPath': 'Portal\\Sprint 42',
        },
        _links: {
          html: {
            href: 'https://dev.azure.com/contoso/portal/_workitems/edit/88',
          },
        },
      };

      if (url.includes('workitems/')) {
        return {
          ok: true,
          json: async () => workItem,
        };
      }

      if (url.includes('workitems')) {
        return {
          ok: true,
          json: async () => ({ value: [workItem] }),
        };
      }

      throw new Error(`Unexpected URL ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);

    await expect(
      handleAzureDevOpsApi(
        'GET',
        '/api/azure-devops/me',
        new URLSearchParams(),
        env,
      ),
    ).resolves.toMatchObject({
      status: 200,
      body: {
        id: 'u1',
        displayName: 'Sophie Quines Mendonca',
        mailAddress: 'sophie@contoso.com',
      },
    });

    await expect(
      handleAzureDevOpsApi(
        'GET',
        '/api/azure-devops/sprint/current',
        new URLSearchParams(),
        env,
      ),
    ).resolves.toMatchObject({
      status: 200,
      body: { name: 'Sprint 42' },
    });

    const workItems = await handleAzureDevOpsApi(
      'GET',
      '/api/azure-devops/work-items',
      new URLSearchParams('sprintId=Portal\\Sprint 42'),
      env,
    );
    expect(workItems.status).toBe(200);
    expect(workItems.body).toMatchObject({
      value: [
        {
          id: 88,
          url: 'https://dev.azure.com/contoso/portal/_workitems/edit/88',
        },
      ],
    });

    await expect(
      handleAzureDevOpsApi(
        'GET',
        '/api/azure-devops/work-items/88',
        new URLSearchParams(),
        env,
      ),
    ).resolves.toMatchObject({
      status: 200,
      body: { id: 88 },
    });

    await expect(
      handleAzureDevOpsApi(
        'GET',
        '/api/azure-devops/pipelines',
        new URLSearchParams(),
        env,
      ),
    ).resolves.toMatchObject({
      status: 200,
      body: { value: [{ id: 501, status: 'inProgress' }] },
    });
  });

  it('resolves the default team and maps Azure failures', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes('/_apis/teams')) {
        return {
          ok: true,
          json: async () => ({
            value: [{ name: 'portal' }, { name: 'other' }],
          }),
        };
      }

      if (url.includes('connectionData')) {
        return { ok: false, status: 401, json: async () => ({}) };
      }

      throw new Error(`Unexpected URL ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      handleAzureDevOpsApi('GET', '/api/azure-devops/me', new URLSearchParams(), {
        VITE_AZURE_DEVOPS_ORGANIZATION: 'contoso',
        VITE_AZURE_DEVOPS_PROJECT: 'portal',
        AZURE_DEVOPS_PAT: 'secret',
      }),
    ).resolves.toMatchObject({
      status: 502,
      body: { message: expect.stringMatching(/PAT|401/) },
    });
  });

  it('fails when the current sprint list is empty', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ value: [] }),
      }),
    );

    await expect(
      handleAzureDevOpsApi(
        'GET',
        '/api/azure-devops/sprint/current',
        new URLSearchParams(),
        env,
      ),
    ).resolves.toMatchObject({
      status: 502,
      body: { message: 'Não foi possível identificar a Sprint atual.' },
    });
  });

  it('builds a web URL when Azure does not send html links', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 10,
          fields: {
            'System.Title': 'Sem link',
            'System.WorkItemType': 'Bug',
            'System.State': 'New',
            'System.IterationPath': 'Sprint 1',
          },
        }),
      }),
    );

    const result = await handleAzureDevOpsApi(
      'GET',
      '/api/azure-devops/work-items/10',
      new URLSearchParams(),
      env,
    );

    expect(result).toMatchObject({
      status: 200,
      body: {
        id: 10,
        url: 'https://dev.azure.com/contoso/portal/_workitems/edit/10',
      },
    });
  });

  it('marks work items as deployed from main or release pull requests', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes('wiql')) {
        return {
          ok: true,
          json: async () => ({ workItems: [{ id: 88 }] }),
        };
      }

      if (url.includes('workitems')) {
        return {
          ok: true,
          json: async () => ({
            value: [
              {
                id: 88,
                fields: {
                  'System.Title': 'Tarefa real',
                  'System.WorkItemType': 'Task',
                  'System.State': 'Active',
                  'System.IterationPath': 'Portal\\Sprint 42',
                },
                relations: [
                  {
                    rel: 'ArtifactLink',
                    url: 'vstfs:///Git/PullRequestId/project%2Frepo-1%2F42',
                  },
                  {
                    rel: 'ArtifactLink',
                    url: 'vstfs:///Git/PullRequestId/project%2Frepo-1%2F43',
                  },
                  {
                    rel: 'ArtifactLink',
                    url: 'vstfs:///Git/PullRequestId/project%2Frepo-1%2F44',
                  },
                ],
              },
            ],
          }),
        };
      }

      if (url.includes('pullrequests/42')) {
        return {
          ok: true,
          json: async () => ({
            status: 'completed',
            targetRefName: 'refs/heads/main',
          }),
        };
      }

      if (url.includes('pullrequests/43')) {
        return {
          ok: true,
          json: async () => ({
            status: 'abandoned',
            targetRefName: 'refs/heads/main',
          }),
        };
      }

      if (url.includes('pullrequests/44')) {
        return {
          ok: true,
          json: async () => ({
            status: 'active',
            targetRefName: 'refs/heads/release/106.3',
          }),
        };
      }

      throw new Error(`Unexpected URL ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);

    const workItems = await handleAzureDevOpsApi(
      'GET',
      '/api/azure-devops/work-items',
      new URLSearchParams('sprintId=Portal\\Sprint 42'),
      env,
    );

    expect(workItems.status).toBe(200);
    expect(workItems.body).toMatchObject({
      value: [{ id: 88, deployed: true, releasePrCreated: true }],
    });
    expect(JSON.stringify(workItems.body)).toContain(
      'https://dev.azure.com/contoso/project/_git/repo-1/pullrequest/42',
    );
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/_apis/git/repositories/repo-1/pullrequests/42'),
      expect.anything(),
    );
  });

  it('queries the whole sprint in lead mode', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.includes('wiql')) {
        expect(String(init?.body)).toContain('[System.IterationPath] UNDER');
        expect(String(init?.body)).not.toContain('[System.AssignedTo] = @Me');
        return {
          ok: true,
          json: async () => ({ workItems: [] }),
        };
      }

      throw new Error(`Unexpected URL ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);

    await expect(
      handleAzureDevOpsApi(
        'GET',
        '/api/azure-devops/work-items',
        new URLSearchParams('sprintId=Portal\\Sprint 42&leadMode=true'),
        env,
      ),
    ).resolves.toEqual({ status: 200, body: { value: [] } });
  });

  it('lists available sprints', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          value: [
            {
              id: 's41',
              name: 'Sprint 41',
              path: 'Portal\\Sprint 41',
              attributes: { timeFrame: 'past' },
            },
            {
              id: 's42',
              name: 'Sprint 42',
              path: 'Portal\\Sprint 42',
              attributes: { timeFrame: 'current' },
            },
          ],
        }),
      }),
    );

    const result = await handleAzureDevOpsApi(
      'GET',
      '/api/azure-devops/sprints',
      new URLSearchParams(),
      env,
    );

    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({
      value: [{ name: 'Sprint 41' }, { name: 'Sprint 42' }],
    });
  });

  it('returns an empty work item list', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ workItems: [] }),
      }),
    );

    await expect(
      handleAzureDevOpsApi(
        'GET',
        '/api/azure-devops/work-items',
        new URLSearchParams('sprintId=s42'),
        env,
      ),
    ).resolves.toEqual({ status: 200, body: { value: [] } });
  });
});
