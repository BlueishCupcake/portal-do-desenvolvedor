import { mapAssignedTo } from '@/mappers/azureDevOps/mapAssignedTo.ts';
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

export function mapAzureWorkItem(workItem: AzureWorkItem): WorkItem {
  const description = workItem.fields['System.Description'];

  return {
    id: workItem.id,
    title: workItem.fields['System.Title'],
    type: mapWorkItemType(workItem.fields['System.WorkItemType']),
    state: workItem.fields['System.State'],
    assignedTo: mapAssignedTo(workItem.fields['System.AssignedTo']),
    boardColumn:
      workItem.fields['System.BoardColumn'] ?? workItem.fields['System.State'],
    iterationPath: workItem.fields['System.IterationPath'],
    description: description ? toPlainText(description) : undefined,
    url: workItem.url,
    priority: workItem.fields['Microsoft.VSTS.Common.Priority'],
    createdAt: workItem.fields['System.CreatedDate'],
    updatedAt: workItem.fields['System.ChangedDate'],
    relatedIds: readRelatedIds(workItem),
    deployed: workItem.deployed === true,
    releasePrCreated: workItem.releasePrCreated === true,
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
