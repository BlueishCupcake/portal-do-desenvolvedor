import { describe, expect, it } from 'vitest';

import {
  parseAzureDeveloper,
  parseAzureSprint,
  parseAzureSprintList,
  parseAzureWorkItem,
  parseAzureWorkItemList,
} from '@/services/azureDevOps/parsers.ts';
import { AzureDevOpsError } from '@/services/azureDevOps/types.ts';

describe('azure devops parsers', () => {
  it('parses a work item list from a wrapped payload', () => {
    const items = parseAzureWorkItemList({
      value: [
        {
          id: 1,
          url: 'https://dev.azure.com/1',
          fields: {
            'System.Title': 'Tarefa',
            'System.WorkItemType': 'Task',
            'System.State': 'Active',
            'System.AssignedTo': 'Sophie',
            'System.IterationPath': 'Sprint 42',
          },
        },
      ],
    });

    expect(items[0]?.id).toBe(1);
  });

  it('parses work item relations', () => {
    expect(
      parseAzureWorkItem({
        id: 10,
        fields: {
          'System.Title': 'Task with bug',
          'System.WorkItemType': 'Task',
          'System.State': 'Active',
          'System.IterationPath': 'Sprint 42',
        },
        relations: [
          {
            rel: 'System.LinkTypes.Related',
            url: 'https://dev.azure.com/org/_apis/wit/workItems/20',
          },
          {
            rel: 'ArtifactLink',
            url: 'vstfs:///Git/Commit/abc',
          },
          {
            rel: 'ArtifactLink',
            url: 'vstfs:///Git/PullRequestId/project%2Frepo%2F42',
          },
        ],
        deployed: true,
        releasePrCreated: true,
      }),
    ).toMatchObject({
      deployed: true,
      releasePrCreated: true,
      relations: [
        {
          rel: 'System.LinkTypes.Related',
          url: 'https://dev.azure.com/org/_apis/wit/workItems/20',
        },
        {
          rel: 'ArtifactLink',
          url: 'vstfs:///Git/PullRequestId/project%2Frepo%2F42',
        },
      ],
    });
  });

  it('prefers the Azure DevOps html link', () => {
    expect(
      parseAzureWorkItem({
        id: 9,
        url: 'https://dev.azure.com/_apis/wit/workItems/9',
        _links: {
          html: { href: 'https://dev.azure.com/org/project/_workitems/edit/9' },
        },
        fields: {
          'System.Title': 'Link',
          'System.WorkItemType': 'Task',
          'System.State': 'New',
          'System.IterationPath': 'Sprint 42',
        },
      }).url,
    ).toBe('https://dev.azure.com/org/project/_workitems/edit/9');
  });

  it('parses a work item list from an array', () => {
    const items = parseAzureWorkItemList([
      {
        id: 2,
        fields: {
          'System.Title': 'Bug',
          'System.WorkItemType': 'Bug',
          'System.State': 'New',
          'System.AssignedTo': {
            displayName: 'Sophie',
            uniqueName: 'sophie',
            id: '1',
          },
          'System.IterationPath': 'Sprint 42',
        },
      },
    ]);

    expect(items[0]?.fields['System.AssignedTo']).toEqual({
      displayName: 'Sophie',
      uniqueName: 'sophie',
      id: '1',
    });
  });

  it('parses sprint and developer payloads', () => {
    expect(
      parseAzureSprint({
        id: '42',
        name: 'Sprint 42',
        path: 'Sprint 42',
        attributes: {
          startDate: '2026-10-01',
          finishDate: '2026-10-15',
          timeFrame: 'current',
        },
      }).attributes.timeFrame,
    ).toBe('current');

    expect(
      parseAzureSprintList({
        value: [
          {
            id: '41',
            name: 'Sprint 41',
            path: 'Sprint 41',
            attributes: { timeFrame: 'past' },
          },
        ],
      }),
    ).toMatchObject([{ id: '41', name: 'Sprint 41' }]);

    expect(
      parseAzureDeveloper({
        id: 'u1',
        displayName: 'Sophie',
        mailAddress: 'sophie@example.com',
      }).mailAddress,
    ).toBe('sophie@example.com');
  });

  it('rejects invalid payloads', () => {
    expect(() => parseAzureWorkItem('nope')).toThrow(AzureDevOpsError);
    expect(() => parseAzureWorkItem({ id: 1 })).toThrow(AzureDevOpsError);
    expect(() => parseAzureWorkItemList('nope')).toThrow(AzureDevOpsError);
    expect(() => parseAzureWorkItemList({})).toThrow(AzureDevOpsError);
    expect(() => parseAzureSprint('nope')).toThrow(AzureDevOpsError);
    expect(() => parseAzureSprintList('nope')).toThrow(AzureDevOpsError);
    expect(() => parseAzureDeveloper('nope')).toThrow(AzureDevOpsError);
    expect(() =>
      parseAzureWorkItem({
        id: 1,
        fields: {
          'System.Title': 'Tarefa',
        },
      }),
    ).toThrow(/System.WorkItemType/);
    expect(() =>
      parseAzureSprint({
        id: '1',
        name: 'Sprint',
        path: 'Sprint',
        attributes: { timeFrame: 'other' },
      }),
    ).not.toThrow();
    expect(
      parseAzureWorkItem({
        id: 3,
        fields: {
          'System.Title': 'Tarefa',
          'System.WorkItemType': 'Task',
          'System.State': 'New',
          'System.AssignedTo': { id: '1' },
          'System.IterationPath': 'Sprint 42',
        },
      }).fields['System.AssignedTo'],
    ).toBeUndefined();
  });
});
