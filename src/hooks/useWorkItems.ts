import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { useAzureDevOpsService } from '@/app/providers/azureDevOpsContext.ts';

interface UseWorkItemsOptions {
  sprintId?: string;
  userId?: string;
  leadMode?: boolean;
}

export function useWorkItems({ sprintId, userId, leadMode = false }: UseWorkItemsOptions) {
  const service = useAzureDevOpsService();

  return useQuery({
    queryKey: ['azure-devops', 'work-items', sprintId, userId, leadMode],
    queryFn: () =>
      service.getUserWorkItems(sprintId ?? '', userId ?? '', { leadMode }),
    enabled: Boolean(sprintId && (leadMode || userId)),
    placeholderData: keepPreviousData,
  });
}
