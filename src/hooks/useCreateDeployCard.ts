import { useMutation } from '@tanstack/react-query';

import { useAzureDevOpsService } from '@/app/providers/azureDevOpsContext.ts';

export function useCreateDeployCard() {
  const service = useAzureDevOpsService();

  return useMutation({
    mutationFn: service.createDeployCard.bind(service),
  });
}
