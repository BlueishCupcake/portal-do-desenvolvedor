import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { AzureDevOpsProvider } from '@/app/providers/AzureDevOpsProvider.tsx';
import { useCurrentSprint } from '@/hooks/useCurrentSprint.ts';
import { useCurrentUser } from '@/hooks/useCurrentUser.ts';
import { useSprints } from '@/hooks/useSprints.ts';
import { useWorkItemDetails } from '@/hooks/useWorkItemDetails.ts';
import { useWorkItems } from '@/hooks/useWorkItems.ts';
import { createMockAzureDevOpsService } from '@/services/azureDevOps/mock/mockService.ts';

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const service = createMockAzureDevOpsService({ delayMs: 0 });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <AzureDevOpsProvider service={service}>{children}</AzureDevOpsProvider>
      </QueryClientProvider>
    );
  };
}

describe('azure devops hooks', () => {
  it('loads user, sprint, work items and details', async () => {
    const wrapper = createWrapper();

    const user = renderHook(() => useCurrentUser(), { wrapper });
    const sprint = renderHook(() => useCurrentSprint(), { wrapper });
    const sprints = renderHook(() => useSprints(), { wrapper });
    const items = renderHook(
      () => useWorkItems({ sprintId: 'sprint-42', userId: 'sophie-quines' }),
      { wrapper },
    );
    const details = renderHook(() => useWorkItemDetails(12345), { wrapper });
    const idleItems = renderHook(() => useWorkItems({}), { wrapper });
    const idleDetails = renderHook(() => useWorkItemDetails(null), { wrapper });

    await waitFor(() => {
      expect(user.result.current.data?.displayName).toBe('Sophie Quines');
      expect(sprint.result.current.data?.name).toBe('Sprint 42');
      expect(sprints.result.current.data?.length).toBeGreaterThan(1);
      expect(items.result.current.data?.length).toBeGreaterThan(0);
      expect(details.result.current.data?.id).toBe(12345);
    });

    expect(idleItems.result.current.fetchStatus).toBe('idle');
    expect(idleDetails.result.current.fetchStatus).toBe('idle');
  });
});
