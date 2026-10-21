import { useQuery } from '@tanstack/react-query';

import { useAzureDevOpsService } from '@/app/providers/azureDevOpsContext.ts';

export function useDeployCards(
  sprintIds: readonly string[] | undefined,
  enabled: boolean,
) {
  const service = useAzureDevOpsService();
  const normalizedSprintIds =
    sprintIds?.filter((sprintId) => sprintId.length > 0) ?? [];

  return useQuery({
    queryKey: ['deploy-cards', ...normalizedSprintIds],
    queryFn: () => service.listDeployCards(normalizedSprintIds),
    enabled: enabled && normalizedSprintIds.length > 0,
    staleTime: 0,
  });
}
