import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AppProviders } from '@/app/providers/AppProviders.tsx';
import { useAzureDevOpsService } from '@/app/providers/azureDevOpsContext.ts';
import { AzureDevOpsProvider } from '@/app/providers/AzureDevOpsProvider.tsx';
import { createMockAzureDevOpsService } from '@/services/azureDevOps/mock/mockService.ts';

function Probe() {
  const service = useAzureDevOpsService();
  return <p>{service ? 'ready' : 'missing'}</p>;
}

describe('providers', () => {
  it('provides an azure devops service', () => {
    render(
      <AppProviders service={createMockAzureDevOpsService({ delayMs: 0 })}>
        <Probe />
      </AppProviders>,
    );

    expect(screen.getByText('ready')).toBeInTheDocument();
  });

  it('creates a default service when none is injected', () => {
    render(
      <AzureDevOpsProvider>
        <Probe />
      </AzureDevOpsProvider>,
    );

    expect(screen.getByText('ready')).toBeInTheDocument();
  });

  it('throws when the service hook is used outside the provider', () => {
    expect(() => render(<Probe />)).toThrow(
      'useAzureDevOpsService deve ser usado dentro de AzureDevOpsProvider.',
    );
  });
});
