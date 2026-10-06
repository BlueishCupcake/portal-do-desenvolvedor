import type { AzureIdentity } from '@/services/azureDevOps/types.ts';

export interface MappedAssignee {
  assignedTo: string;
  assignedToId?: string;
  assignedToUniqueName?: string;
}

export function mapAssignedTo(
  assignedTo: AzureIdentity | string | undefined,
): string {
  return mapAssignee(assignedTo).assignedTo;
}

export function mapAssignee(
  assignedTo: AzureIdentity | string | undefined,
): MappedAssignee {
  if (typeof assignedTo === 'string') {
    return { assignedTo };
  }

  if (assignedTo && assignedTo.displayName.length > 0) {
    return {
      assignedTo: assignedTo.displayName,
      assignedToId: assignedTo.id,
      assignedToUniqueName: assignedTo.uniqueName,
    };
  }

  return { assignedTo: 'Não atribuído' };
}
