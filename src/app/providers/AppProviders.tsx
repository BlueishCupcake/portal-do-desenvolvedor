import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';

import { AzureDevOpsProvider } from '@/app/providers/AzureDevOpsProvider.tsx';
import { LeadModeProvider } from '@/app/providers/LeadModeProvider.tsx';
import { ThemeProvider } from '@/app/providers/ThemeProvider.tsx';
import { WorkspaceViewProvider } from '@/app/providers/WorkspaceViewProvider.tsx';
import type { AzureDevOpsService } from '@/services/azureDevOps/types.ts';

interface AppProvidersProps {
  children: ReactNode;
  service?: AzureDevOpsService;
  queryClient?: QueryClient;
}

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}

export function AppProviders({ children, service, queryClient }: AppProvidersProps) {
  const [client] = useState(() => queryClient ?? createQueryClient());

  return (
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <LeadModeProvider>
          <WorkspaceViewProvider>
            <AzureDevOpsProvider service={service}>{children}</AzureDevOpsProvider>
          </WorkspaceViewProvider>
        </LeadModeProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
