import type { AzureIdentity } from '@/services/azureDevOps/types.ts';

export function mapAssignedTo(
  assignedTo: AzureIdentity | string | undefined,
): string {
  if (typeof assignedTo === 'string') {
    return assignedTo;
  }

  if (assignedTo && assignedTo.displayName.length > 0) {
    return assignedTo.displayName;
  }

  return 'Não atribuído';
}
