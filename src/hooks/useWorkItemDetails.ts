import { useQuery } from '@tanstack/react-query';

import { useAzureDevOpsService } from '@/app/providers/azureDevOpsContext.ts';

export function useWorkItemDetails(id: number | null) {
  const service = useAzureDevOpsService();

  return useQuery({
    queryKey: ['azure-devops', 'work-item-details', id],
    queryFn: () => service.getWorkItemDetails(id ?? 0),
    enabled: id !== null,
  });
}
