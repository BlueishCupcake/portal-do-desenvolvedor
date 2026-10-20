import { mapAssignee } from '@/mappers/azureDevOps/mapAssignedTo.ts';
import { mapWorkItemType } from '@/mappers/azureDevOps/mapWorkItemType.ts';
import type { AzureWorkItem } from '@/services/azureDevOps/types.ts';
import type { WorkItem, WorkItemDetails } from '@/types/workItem.ts';
import { toPlainText } from '@/utils/toPlainText.ts';

function readRelatedIds(workItem: AzureWorkItem): number[] {
  return (workItem.relations ?? []).flatMap((relation) => {
    const match = /workItems\/(\d+)$/i.exec(relation.url ?? '');
    return match ? [Number(match[1])] : [];
  });
}

function isBlockedFlag(value: string | boolean | undefined): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  return /^(yes|true|sim)$/i.test(value?.trim() ?? '');
}

function hasBlockedTag(tags: string | undefined): boolean {
  return (tags ?? '')
    .split(';')
    .some((tag) => /block|bloque/i.test(tag.trim()));
}

function readStoryPoints(workItem: AzureWorkItem): number | undefined {
  return (
    workItem.fields['Microsoft.VSTS.Scheduling.StoryPoints'] ??
    workItem.fields['Microsoft.VSTS.Scheduling.Effort']
  );
}

export function mapAzureWorkItem(workItem: AzureWorkItem): WorkItem {
  const description = workItem.fields['System.Description'];
  const assignee = mapAssignee(workItem.fields['System.AssignedTo']);

  return {
    id: workItem.id,
    title: workItem.fields['System.Title'],
    type: mapWorkItemType(workItem.fields['System.WorkItemType']),
    state: workItem.fields['System.State'],
    assignedTo: assignee.assignedTo,
    assignedToId: assignee.assignedToId,
    assignedToUniqueName: assignee.assignedToUniqueName,
    boardColumn: workItem.fields['System.BoardColumn'] ?? 'Sem coluna do board',
    iterationPath: workItem.fields['System.IterationPath'],
    description: description ? toPlainText(description) : undefined,
    url: workItem.url,
    priority: workItem.fields['Microsoft.VSTS.Common.Priority'],
    createdAt: workItem.fields['System.CreatedDate'],
    updatedAt: workItem.fields['System.ChangedDate'],
    closedAt: workItem.fields['Microsoft.VSTS.Common.ClosedDate'],
    dueDate: workItem.fields['Microsoft.VSTS.Scheduling.DueDate'],
    relatedIds: readRelatedIds(workItem),
    deployed: workItem.deployed === true,
    releasePrCreated: workItem.releasePrCreated === true,
    storyPoints: readStoryPoints(workItem),
    pullRequests: workItem.pullRequests?.map((pullRequest) => ({
      id: pullRequest.id,
      repositoryName: pullRequest.repositoryName,
      projectName: pullRequest.projectName,
      targetBranch: pullRequest.targetRefName,
      status: pullRequest.status,
      url: pullRequest.url,
    })),
    relatedBugs: workItem.relatedBugs?.map((bug) => ({
      id: bug.id,
      title: bug.title,
      state: bug.state,
      url: bug.url,
    })),
    blocked:
      isBlockedFlag(workItem.fields['Microsoft.VSTS.CMMI.Blocked']) ||
      hasBlockedTag(workItem.fields['System.Tags']),
  };
}

export function mapAzureWorkItemDetails(
  workItem: AzureWorkItem,
  sprintName: string,
): WorkItemDetails {
  const mapped = mapAzureWorkItem(workItem);

  return {
    ...mapped,
    sprintName,
    createdAt: workItem.fields['System.CreatedDate'] ?? '',
    updatedAt: workItem.fields['System.ChangedDate'] ?? '',
  };
}
