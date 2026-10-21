import { useMutation } from '@tanstack/react-query';

import { useAzureDevOpsService } from '@/app/providers/azureDevOpsContext.ts';
import type { AttachTasksToDeployCardInput } from '@/types/deployCard.ts';

export function useAttachTasksToDeployCard() {
  const service = useAzureDevOpsService();

  return useMutation({
    mutationFn: ({
      deployCardId,
      input,
    }: {
      deployCardId: number;
      input: AttachTasksToDeployCardInput;
    }) => service.attachTasksToDeployCard(deployCardId, input),
  });
}
