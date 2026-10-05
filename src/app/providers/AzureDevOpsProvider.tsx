import { type ReactNode, useState } from 'react';

import { AzureDevOpsContext } from '@/app/providers/azureDevOpsContext.ts';
import { createAzureDevOpsService } from '@/services/azureDevOps/client.ts';
import type { AzureDevOpsService } from '@/services/azureDevOps/types.ts';

interface AzureDevOpsProviderProps {
  children: ReactNode;
  service?: AzureDevOpsService;
}

export function AzureDevOpsProvider({
  children,
  service,
}: AzureDevOpsProviderProps) {
  const [fallbackService] = useState(() => createAzureDevOpsService());
  const resolvedService = service ?? fallbackService;

  return (
    <AzureDevOpsContext.Provider value={resolvedService}>
      {children}
    </AzureDevOpsContext.Provider>
  );
}
