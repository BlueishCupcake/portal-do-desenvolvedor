import { useQuery } from '@tanstack/react-query';

import { useAzureDevOpsService } from '@/app/providers/azureDevOpsContext.ts';

export function useCurrentUser() {
  const service = useAzureDevOpsService();

  return useQuery({
    queryKey: ['azure-devops', 'current-user'],
    queryFn: () => service.getCurrentUser(),
  });
}
