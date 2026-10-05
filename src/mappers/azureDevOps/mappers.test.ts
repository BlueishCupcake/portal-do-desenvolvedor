import { describe, expect, it } from 'vitest';

import { mapAssignedTo } from '@/mappers/azureDevOps/mapAssignedTo.ts';
import { mapAzureDeveloper } from '@/mappers/azureDevOps/mapDeveloper.ts';
import { mapAzureSprint } from '@/mappers/azureDevOps/mapSprint.ts';
import {
  mapAzureWorkItem,
  mapAzureWorkItemDetails,
} from '@/mappers/azureDevOps/mapWorkItem.ts';
import { mapWorkItemType } from '@/mappers/azureDevOps/mapWorkItemType.ts';
import type { AzureWorkItem } from '@/services/azureDevOps/types.ts';

const azureWorkItem: AzureWorkItem = {
  id: 88,
  url: 'https://dev.azure.com/item/88',
  fields: {
    'System.Title': 'Item Azure',
    'System.WorkItemType': 'User Story',
    'System.State': 'Active',
    'System.AssignedTo': { displayName: 'Sophie Quines' },
    'System.BoardColumn': 'Ag. QA',
    'System.IterationPath': 'Portal\\Sprint 42',
    'System.Description': '<p>Descrição</p>',
    'Microsoft.VSTS.Common.Priority': 2,
    'System.CreatedDate': '2026-10-01',
    'System.ChangedDate': '2026-10-04',
  },
};

describe('azure devops mappers', () => {
  it('maps known and unknown work item types', () => {
    expect(mapWorkItemType('Task')).toBe('Task');
    expect(mapWorkItemType('Epic')).toBe('Other');
  });

  it('maps assigned identities', () => {
    expect(mapAssignedTo('Sophie')).toBe('Sophie');
    expect(mapAssignedTo({ displayName: 'Sophie Quines' })).toBe('Sophie Quines');
    expect(mapAssignedTo({ displayName: '' })).toBe('Não atribuído');
    expect(mapAssignedTo(undefined)).toBe('Não atribuído');
  });

  it('maps work items, sprints and developers', () => {
    expect(mapAzureWorkItem(azureWorkItem)).toMatchObject({
      id: 88,
      title: 'Item Azure',
      type: 'User Story',
      assignedTo: 'Sophie Quines',
      boardColumn: 'Ag. QA',
      description: 'Descrição',
      relatedIds: [],
      deployed: false,
      releasePrCreated: false,
    });

    expect(
      mapAzureWorkItem({
        ...azureWorkItem,
        deployed: true,
        releasePrCreated: true,
      }),
    ).toMatchObject({
      deployed: true,
      releasePrCreated: true,
    });

    expect(
      mapAzureWorkItem({
        ...azureWorkItem,
        relations: [
          {
            rel: 'System.LinkTypes.Related',
            url: 'https://dev.azure.com/org/_apis/wit/workItems/114219',
          },
        ],
      }).relatedIds,
    ).toEqual([114219]);

    expect(mapAzureWorkItemDetails(azureWorkItem, 'Sprint 42').sprintName).toBe(
      'Sprint 42',
    );

    expect(
      mapAzureWorkItem({
        id: 1,
        fields: {
          'System.Title': 'Sem coluna',
          'System.WorkItemType': 'Task',
          'System.State': 'New',
          'System.IterationPath': 'Sprint 42',
        },
      }).boardColumn,
    ).toBe('New');

    expect(
      mapAzureSprint({
        id: 's1',
        name: 'Sprint 1',
        path: 'Sprint 1',
        attributes: {},
      }),
    ).toEqual({
      id: 's1',
      name: 'Sprint 1',
      path: 'Sprint 1',
      startDate: '',
      endDate: '',
    });

    expect(
      mapAzureDeveloper({
        displayName: 'Sophie',
        uniqueName: 'sophie@example.com',
      }),
    ).toEqual({
      id: 'sophie@example.com',
      displayName: 'Sophie',
      email: 'sophie@example.com',
    });

    expect(
      mapAzureDeveloper({
        displayName: 'Sophie',
      }),
    ).toEqual({
      id: 'Sophie',
      displayName: 'Sophie',
      email: undefined,
    });
  });
});
