import { formatWorkItemType } from '@/constants/workItem.ts';
import type { Developer } from '@/types/developer.ts';
import type {
  MetricBreakdown,
  MetricKpi,
  MetricPeriod,
  MetricScope,
  MetricSprintProgress,
  MetricWorkItemRow,
  ScopeMetrics,
} from '@/types/metrics.ts';
import type { WorkItem } from '@/types/workItem.ts';
import {
  dedupeWorkItems,
  isActiveWorkItemState,
  isCompletedWorkItemState,
  isOverdueWorkItem,
  isUnassignedWorkItem,
} from '@/utils/metrics/classify.ts';
import { KPI_DEFINITIONS } from '@/utils/metrics/definitions.ts';
import {
  isDateInRange,
  parseUtcDate,
  resolveMetricPeriodRange,
} from '@/utils/metrics/period.ts';
import {
  type AssignedUser,
  isAssignedToUser,
} from '@/utils/sumAssignedStoryPoints.ts';

function isPersonalWorkItem(item: WorkItem, user: AssignedUser): boolean {
  if (user.id && item.assignedToId) {
    return item.assignedToId === user.id;
  }

  return isAssignedToUser(item, user);
}

export interface CalculateMetricsInput {
  items: readonly WorkItem[];
  scope: MetricScope;
  period: MetricPeriod;
  user?: Developer;
  sprint?: { startDate?: string; endDate?: string };
  pullRequestCount?: number;
  pipelineCount?: number;
  now?: Date;
}

function completionDate(item: WorkItem): Date | undefined {
  if (!isCompletedWorkItemState(item.state)) {
    return undefined;
  }

  return parseUtcDate(item.closedAt ?? item.updatedAt);
}

function countBy(items: readonly WorkItem[], readLabel: (item: WorkItem) => string): MetricBreakdown[] {
  const counts = new Map<string, number>();

  for (const item of items) {
    const label = readLabel(item);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
}

function toRow(item: WorkItem): MetricWorkItemRow {
  return {
    id: item.id,
    title: item.title,
    type: item.type,
    state: item.state,
    assignedTo: item.assignedTo,
    updatedAt: item.updatedAt,
    closedAt: item.closedAt,
    dueDate: item.dueDate,
    url: item.url,
  };
}

function kpi(
  id: keyof typeof KPI_DEFINITIONS,
  label: string,
  value: number,
  kind: MetricKpi['kind'],
): MetricKpi {
  return {
    id,
    label,
    value,
    definition: KPI_DEFINITIONS[id],
    kind,
  };
}

export function calculateScopeMetrics(input: CalculateMetricsInput): ScopeMetrics {
  const now = input.now ?? new Date();
  const range = resolveMetricPeriodRange(input.period, input.sprint, now);
  const uniqueItems = dedupeWorkItems(input.items);
  const user = input.user;
  const scopedItems =
    input.scope === 'personal' && user
      ? uniqueItems.filter((item) => isPersonalWorkItem(item, user))
      : uniqueItems;

  const activeItems = scopedItems.filter((item) => isActiveWorkItemState(item.state));
  const completedInPeriod = scopedItems.filter((item) =>
    isDateInRange(completionDate(item), range.start, range.end),
  );
  const overdueItems = scopedItems.filter((item) => isOverdueWorkItem(item, now));
  const overdueAvailable = scopedItems.some((item) => Boolean(item.dueDate));
  const bugs = scopedItems.filter((item) => item.type === 'Bug');
  const unassigned = scopedItems.filter((item) => isUnassignedWorkItem(item));

  const kpis: MetricKpi[] = [];

  if (input.scope === 'personal') {
    kpis.push(kpi('assigned', 'Atribuídos a mim', scopedItems.length, 'current'));
  }

  kpis.push(kpi('active', 'Ativos', activeItems.length, 'current'));
  kpis.push(kpi('completed', 'Concluídos no período', completedInPeriod.length, 'period'));

  if (overdueAvailable) {
    kpis.push(kpi('overdue', 'Atrasados', overdueItems.length, 'current'));
  }

  kpis.push(kpi('bugs', 'Bugs', bugs.length, 'current'));

  if (input.scope === 'personal' && input.pullRequestCount !== undefined) {
    kpis.push(kpi('pullRequests', 'PRs', input.pullRequestCount, 'current'));
  }

  if (input.scope === 'personal' && input.pipelineCount !== undefined) {
    kpis.push(kpi('pipelines', 'Pipelines', input.pipelineCount, 'current'));
  }

  if (input.scope !== 'personal') {
    kpis.push(kpi('unassigned', 'Sem responsável', unassigned.length, 'current'));
  }

  let sprintProgress: MetricSprintProgress | undefined;
  if (input.period === 'current-sprint' && input.scope !== 'personal') {
    const completed = scopedItems.filter((item) => isCompletedWorkItemState(item.state)).length;
    sprintProgress = {
      completed,
      total: scopedItems.length,
      percent:
        scopedItems.length === 0
          ? 0
          : Math.round((completed / scopedItems.length) * 100),
      definition: KPI_DEFINITIONS.sprintProgress,
    };
  }

  return {
    kpis,
    byType: countBy(scopedItems, (item) => formatWorkItemType(item.type)),
    byState: countBy(scopedItems, (item) => item.state),
    byAssignee:
      input.scope === 'personal'
        ? undefined
        : countBy(scopedItems, (item) => item.assignedTo),
    items: scopedItems.map(toRow),
    overdueAvailable,
    sprintProgress,
  };
}
