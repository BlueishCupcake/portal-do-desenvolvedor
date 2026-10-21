import { mapWorkItemType } from '@/mappers/azureDevOps/mapWorkItemType.ts';
import type { MetricPeriod, MetricScope, MetricWorkItemRow, ScopeMetrics } from '@/types/metrics.ts';
import type { WorkItem } from '@/types/workItem.ts';
import { matchesDevelopers } from '@/utils/filterWorkItems.ts';
import { calculateScopeMetrics } from '@/utils/metrics/calculateMetrics.ts';

interface FilterMetricsByDevelopersOptions {
  scope: MetricScope;
  period: MetricPeriod;
  sprint?: { startDate?: string; endDate?: string };
  now?: Date;
}

function toWorkItem(row: MetricWorkItemRow): WorkItem {
  return {
    id: row.id,
    title: row.title,
    type: mapWorkItemType(row.type),
    state: row.state,
    assignedTo: row.assignedTo,
    boardColumn: '',
    iterationPath: '',
    url: row.url,
    updatedAt: row.updatedAt,
    closedAt: row.closedAt,
    dueDate: row.dueDate,
  };
}

export function filterMetricsByDevelopers(
  metrics: ScopeMetrics,
  developers: readonly string[],
  options: FilterMetricsByDevelopersOptions,
): ScopeMetrics {
  if (developers.length === 0) {
    return metrics;
  }

  return calculateScopeMetrics({
    items: metrics.items
      .filter((item) => matchesDevelopers(item, developers))
      .map(toWorkItem),
    scope: options.scope === 'personal' ? 'team' : options.scope,
    period: options.period,
    sprint: options.sprint,
    now: options.now,
  });
}
