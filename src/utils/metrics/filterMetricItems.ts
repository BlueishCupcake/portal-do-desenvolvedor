import type { MetricPeriod, MetricWorkItemRow } from '@/types/metrics.ts';
import {
  isActiveWorkItemState,
  isCompletedWorkItemState,
  isOverdueWorkItem,
  isUnassignedWorkItem,
} from '@/utils/metrics/classify.ts';
import {
  isDateInRange,
  parseUtcDate,
  resolveMetricPeriodRange,
} from '@/utils/metrics/period.ts';

export function filterMetricItems(
  items: readonly MetricWorkItemRow[],
  kpiId: string | null,
  period: MetricPeriod,
  sprint?: { startDate?: string; endDate?: string },
  now: Date = new Date(),
): MetricWorkItemRow[] {
  if (!kpiId) {
    return [...items];
  }

  const range = resolveMetricPeriodRange(period, sprint, now);

  return items.filter((item) => {
    if (kpiId === 'assigned') {
      return true;
    }

    if (kpiId === 'active') {
      return isActiveWorkItemState(item.state);
    }

    if (kpiId === 'completed') {
      if (!isCompletedWorkItemState(item.state)) {
        return false;
      }

      return isDateInRange(parseUtcDate(item.closedAt ?? item.updatedAt), range.start, range.end);
    }

    if (kpiId === 'overdue') {
      return isOverdueWorkItem(item, now);
    }

    if (kpiId === 'bugs') {
      return item.type === 'Bug';
    }

    if (kpiId === 'unassigned') {
      return isUnassignedWorkItem(item);
    }

    return true;
  });
}
