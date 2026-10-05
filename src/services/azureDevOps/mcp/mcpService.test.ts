import { describe, expect, it } from 'vitest';

import { createMcpAzureDevOpsService } from '@/services/azureDevOps/mcp/mcpService.ts';
import type { McpTransport } from '@/services/azureDevOps/types.ts';
import { AzureDevOpsError } from '@/services/azureDevOps/types.ts';
import type { JsonValue } from '@/utils/json.ts';

const azureItem = {
  id: 11,
  url: 'https://dev.azure.com/11',
  fields: {
    'System.Title': 'Tarefa MCP',
    'System.WorkItemType': 'Task',
    'System.State': 'Active',
    'System.AssignedTo': { displayName: 'Sophie' },
    'System.BoardColumn': 'Doing',
    'System.IterationPath': 'Portal\\Sprint 42',
    'System.IterationLevel3': 'Sprint 42',
    'System.CreatedDate': '2026-10-01',
    'System.ChangedDate': '2026-10-04',
  },
};

function createTransport(impl: McpTransport['invoke']): McpTransport {
  return { invoke: impl };
}

const tools = {
  getCurrentUser: 'get_current_user',
  getCurrentSprint: 'get_current_sprint',
  getSprints: 'get_sprints',
  getUserWorkItems: 'get_user_work_items',
  getWorkItemDetails: 'get_work_item_details',
};

const context = {
  organization: 'contoso',
  project: 'portal',
  team: 'devs',
};

describe('createMcpAzureDevOpsService', () => {
  it('maps MCP responses to domain models', async () => {
    const service = createMcpAzureDevOpsService({
      tools,
      context,
      transport: createTransport(async (tool): Promise<JsonValue> => {
        if (tool === 'get_current_user') {
          return { displayName: 'Sophie', id: 'u1' };
        }
        if (tool === 'get_current_sprint') {
          return {
            id: 's42',
            name: 'Sprint 42',
            path: 'Sprint 42',
            attributes: { startDate: '2026-10-01', finishDate: '2026-10-15' },
          };
        }
        if (tool === 'get_sprints') {
          return {
            value: [
              {
                id: 's42',
                name: 'Sprint 42',
                path: 'Sprint 42',
                attributes: { startDate: '2026-10-01', finishDate: '2026-10-15' },
              },
            ],
          };
        }
        if (tool === 'get_user_work_items') {
          return { value: [azureItem] };
        }
        return azureItem;
      }),
    });

    await expect(service.getCurrentUser()).resolves.toMatchObject({
      displayName: 'Sophie',
    });
    await expect(service.getCurrentSprint()).resolves.toMatchObject({
      name: 'Sprint 42',
    });
    await expect(service.getSprints()).resolves.toMatchObject([
      { name: 'Sprint 42' },
    ]);
    await expect(service.getUserWorkItems('s42', 'u1')).resolves.toMatchObject([
      { id: 11, title: 'Tarefa MCP' },
    ]);
    await expect(service.getWorkItemDetails(11)).resolves.toMatchObject({
      sprintName: 'Sprint 42',
    });
  });

  it('reads the current sprint from a value list and infers sprint name', async () => {
    const service = createMcpAzureDevOpsService({
      tools,
      context,
      transport: createTransport(async (tool): Promise<JsonValue> => {
        if (tool === 'get_current_sprint') {
          return {
            value: [
              {
                id: 's1',
                name: 'Sprint 1',
                path: 'Sprint 1',
                attributes: {},
              },
            ],
          };
        }

        return {
          id: 5,
          fields: {
            'System.Title': 'Sem nível',
            'System.WorkItemType': 'Bug',
            'System.State': 'New',
            'System.IterationPath': 'Portal\\Sprint 7',
          },
        };
      }),
    });

    await expect(service.getCurrentSprint()).resolves.toMatchObject({
      name: 'Sprint 1',
    });
    await expect(service.getWorkItemDetails(5)).resolves.toMatchObject({
      sprintName: 'Sprint 7',
    });
  });

  it('wraps transport errors', async () => {
    const service = createMcpAzureDevOpsService({
      tools,
      context,
      transport: createTransport(async () => {
        throw new Error('timeout');
      }),
    });

    await expect(service.getCurrentUser()).rejects.toThrow('timeout');

    const adoService = createMcpAzureDevOpsService({
      tools,
      context,
      transport: createTransport(async () => {
        throw new AzureDevOpsError('mcp down');
      }),
    });

    await expect(adoService.getCurrentUser()).rejects.toThrow('mcp down');

    const unknownService = createMcpAzureDevOpsService({
      tools,
      context,
      transport: createTransport(async () => {
        throw 'boom';
      }),
    });

    await expect(unknownService.getCurrentUser()).rejects.toThrow(
      'Não foi possível comunicar com o Azure DevOps através do MCP.',
    );
  });

  it('fails when the current sprint list is empty', async () => {
    const service = createMcpAzureDevOpsService({
      tools,
      context,
      transport: createTransport(async () => ({ value: [] })),
    });

    await expect(service.getCurrentSprint()).rejects.toThrow(
      'Não foi possível identificar a Sprint atual.',
    );
  });
});
