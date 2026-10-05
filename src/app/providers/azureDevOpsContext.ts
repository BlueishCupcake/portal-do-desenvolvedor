import { createContext, useContext } from 'react';

import type { AzureDevOpsService } from '@/services/azureDevOps/types.ts';

export const AzureDevOpsContext = createContext<AzureDevOpsService | null>(null);

export function useAzureDevOpsService(): AzureDevOpsService {
  const service = useContext(AzureDevOpsContext);

  if (!service) {
    throw new Error(
      'useAzureDevOpsService deve ser usado dentro de AzureDevOpsProvider.',
    );
  }

  return service;
}
