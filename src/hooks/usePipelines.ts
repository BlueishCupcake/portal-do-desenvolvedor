import { useQuery } from '@tanstack/react-query';

import { useAzureDevOpsService } from '@/app/providers/azureDevOpsContext.ts';

export function usePipelines(enabled = true) {
  const service = useAzureDevOpsService();

  return useQuery({
    queryKey: ['azure-devops', 'pipelines', 'current-user'],
    queryFn: () => service.getUserPipelines(),
    enabled,
    refetchInterval: 30_000,
    refetchIntervalInBackground: true,
  });
}
