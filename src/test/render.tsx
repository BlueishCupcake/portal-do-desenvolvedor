import { QueryClient } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';

import { AppProviders } from '@/app/providers/AppProviders.tsx';
import { createMockAzureDevOpsService } from '@/services/azureDevOps/mock/mockService.ts';
import type { AzureDevOpsService } from '@/services/azureDevOps/types.ts';

interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  service?: AzureDevOpsService;
}

export function renderWithProviders(
  ui: ReactElement,
  options: RenderWithProvidersOptions = {},
) {
  const { service, ...renderOptions } = options;
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  const resolvedService = service ?? createMockAzureDevOpsService({ delayMs: 0 });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <AppProviders service={resolvedService} queryClient={queryClient}>
        {children}
      </AppProviders>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    service: resolvedService,
  };
}
