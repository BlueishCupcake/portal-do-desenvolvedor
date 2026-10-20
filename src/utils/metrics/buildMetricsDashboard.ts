import type { Developer } from '@/types/developer.ts';
import type {
  MetricPeriod,
  MetricsContext,
  MetricScope,
  MetricsDashboardData,
  MetricSourceError,
  MetricSourceStatus,
  VdmProgress,
} from '@/types/metrics.ts';
import type { WorkItem } from '@/types/workItem.ts';
import { calculateScopeMetrics } from '@/utils/metrics/calculateMetrics.ts';
import { METRIC_PERMISSION_NOTES } from '@/utils/metrics/definitions.ts';

export interface BuildMetricsDashboardInput {
  generatedAt: string;
  scope: MetricScope;
  period: MetricPeriod;
  context: Omit<MetricsContext, 'period' | 'permissionNote'> & {
    permissionNote?: string;
  };
  items: readonly WorkItem[];
  user?: Developer;
  pullRequestCount?: number;
  pipelineCount?: number;
  vdm?: VdmProgress;
  sources: MetricSourceStatus;
  errors?: MetricSourceError[];
  now?: Date;
}

export function buildMetricsDashboard(
  input: BuildMetricsDashboardInput,
): MetricsDashboardData {
  const workItemsFailed = input.sources.workItems !== 'ok';

  return {
    generatedAt: input.generatedAt,
    context: {
      organization: input.context.organization,
      project: input.context.project,
      team: input.context.team,
      period: input.period,
      periodStart: input.context.periodStart,
      periodEnd: input.context.periodEnd,
      sprintId: input.context.sprintId,
      sprintName: input.context.sprintName,
      permissionNote:
        input.context.permissionNote ?? METRIC_PERMISSION_NOTES[input.scope],
    },
    scope: input.scope,
    vdm: input.vdm,
    metrics: workItemsFailed
      ? null
      : calculateScopeMetrics({
          items: input.items,
          scope: input.scope,
          period: input.period,
          user: input.user,
          sprint: {
            startDate: input.context.periodStart,
            endDate: input.context.periodEnd,
          },
          pullRequestCount:
            input.sources.pullRequests === 'ok' ? input.pullRequestCount : undefined,
          pipelineCount:
            input.sources.pipelines === 'ok' ? input.pipelineCount : undefined,
          now: input.now,
        }),
    sources: input.sources,
    errors: input.errors ?? [],
  };
}
