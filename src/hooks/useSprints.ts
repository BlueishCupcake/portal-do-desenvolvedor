import { useQuery } from '@tanstack/react-query';

import { useAzureDevOpsService } from '@/app/providers/azureDevOpsContext.ts';

export function useSprints() {
  const service = useAzureDevOpsService();

  return useQuery({
    queryKey: ['azure-devops', 'sprints'],
    queryFn: () => service.getSprints(),
  });
}
