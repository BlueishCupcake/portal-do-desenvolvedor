import { useQuery } from '@tanstack/react-query';

import { useAzureDevOpsService } from '@/app/providers/azureDevOpsContext.ts';

export function useCurrentSprint() {
  const service = useAzureDevOpsService();

  return useQuery({
    queryKey: ['azure-devops', 'current-sprint'],
    queryFn: () => service.getCurrentSprint(),
  });
}
