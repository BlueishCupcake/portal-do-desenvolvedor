import { useQuery } from '@tanstack/react-query';

import { useAzureDevOpsService } from '@/app/providers/azureDevOpsContext.ts';
import type { MetricPeriod, MetricScope } from '@/types/metrics.ts';

interface UseMetricsOptions {
  scope: MetricScope;
  period: MetricPeriod;
  sprintId?: string;
}

export function useMetrics({ scope, period, sprintId }: UseMetricsOptions) {
  const service = useAzureDevOpsService();
  const needsSprint = period === 'current-sprint';

  return useQuery({
    queryKey: ['azure-devops', 'metrics', scope, period, sprintId ?? ''],
    queryFn: () => service.getMetrics({ scope, period, sprintId }),
    enabled: !needsSprint || Boolean(sprintId),
  });
}
