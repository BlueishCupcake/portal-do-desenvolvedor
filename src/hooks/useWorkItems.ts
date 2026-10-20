import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { useAzureDevOpsService } from '@/app/providers/azureDevOpsContext.ts';

interface UseWorkItemsOptions {
  sprintId?: string;
  sprintIds?: string[];
  userId?: string;
  leadMode?: boolean;
}

export function useWorkItems({
  sprintId,
  sprintIds,
  userId,
  leadMode = false,
}: UseWorkItemsOptions) {
  const service = useAzureDevOpsService();
  const ids = (sprintIds?.length ? sprintIds : sprintId ? [sprintId] : []).filter(
    (id) => id.length > 0,
  );

  return useQuery({
    queryKey: ['azure-devops', 'work-items', ids.join('|'), userId, leadMode],
    queryFn: () => service.getUserWorkItems(ids, userId ?? '', { leadMode }),
    enabled: Boolean(ids.length > 0 && (leadMode || userId)),
    placeholderData: keepPreviousData,
  });
}
