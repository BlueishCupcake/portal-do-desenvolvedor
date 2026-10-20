import { escapeWiqlValue } from './client.ts';

export const METRIC_SCOPES = ['personal', 'team', 'project'] as const;
export const METRIC_PERIODS = [
  'current-sprint',
  '7-days',
  '30-days',
  '90-days',
] as const;

export type ServerMetricScope = (typeof METRIC_SCOPES)[number];
export type ServerMetricPeriod = (typeof METRIC_PERIODS)[number];

export const METRICS_WORK_ITEM_FIELDS = [
  'System.Title',
  'System.WorkItemType',
  'System.State',
  'System.AssignedTo',
  'System.BoardColumn',
  'System.IterationPath',
  'System.CreatedDate',
  'System.ChangedDate',
  'Microsoft.VSTS.Common.Priority',
  'Microsoft.VSTS.Common.ClosedDate',
  'Microsoft.VSTS.Scheduling.DueDate',
].join(',');

const PERIOD_DAYS: Record<Exclude<ServerMetricPeriod, 'current-sprint'>, number> = {
  '7-days': 7,
  '30-days': 30,
  '90-days': 90,
};

const PROJECT_FILTER = '[System.TeamProject] = @project';

export interface ParsedMetricsQuery {
  scope: ServerMetricScope;
  period: ServerMetricPeriod;
  sprintId?: string;
}

export function parseMetricsQuery(searchParams: URLSearchParams): ParsedMetricsQuery {
  const scope = searchParams.get('scope') ?? 'personal';
  const period = searchParams.get('period') ?? 'current-sprint';
  const sprintId = searchParams.get('sprintId') ?? undefined;

  if (!METRIC_SCOPES.includes(scope as ServerMetricScope)) {
    throw new Error('Escopo de métricas inválido.');
  }

  if (!METRIC_PERIODS.includes(period as ServerMetricPeriod)) {
    throw new Error('Período de métricas inválido.');
  }

  return {
    scope: scope as ServerMetricScope,
    period: period as ServerMetricPeriod,
    sprintId: sprintId && sprintId.length > 0 ? sprintId : undefined,
  };
}

export function startOfUtcMonth(now: Date = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export function resolveRollingPeriodStart(
  period: ServerMetricPeriod,
  now: Date = new Date(),
): Date | undefined {
  if (period === 'current-sprint') {
    return undefined;
  }

  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  start.setUTCDate(start.getUTCDate() - PERIOD_DAYS[period]);
  return start;
}

export function uniqueWorkItemIds(ids: readonly number[]): number[] {
  return [...new Set(ids)];
}

export function buildIterationClause(sprintIds: readonly string[]): string {
  const clauses = [
    ...new Set(
      sprintIds
        .filter((sprintId) => sprintId.length > 0)
        .map((sprintId) => {
          if (sprintId.includes('\\') || sprintId.includes('/')) {
            return `[System.IterationPath] UNDER '${escapeWiqlValue(sprintId)}'`;
          }

          return '[System.IterationPath] = @CurrentIteration';
        }),
    ),
  ];

  if (clauses.length === 0) {
    return '[System.IterationPath] = @CurrentIteration';
  }

  if (clauses.length === 1) {
    return clauses[0];
  }

  return `(${clauses.join(' OR ')})`;
}

export function buildSprintWorkItemsQuery(
  sprintIds: readonly string[],
  leadMode: boolean,
): string {
  const assignment = leadMode ? '' : ' AND [System.AssignedTo] = @Me';
  return `SELECT [System.Id] FROM WorkItems WHERE ${PROJECT_FILTER} AND ${buildIterationClause(sprintIds)}${assignment}`;
}

export function buildSprintMetricsQuery(sprintId: string, leadMode: boolean): string {
  return buildSprintWorkItemsQuery(sprintId ? [sprintId] : [], leadMode);
}

export function buildVdmClosedInMonthQuery(monthStart: string): string {
  return `SELECT [System.Id] FROM WorkItems WHERE ${PROJECT_FILTER} AND [System.AssignedTo] = @Me AND [Microsoft.VSTS.Common.ClosedDate] >= '${monthStart}'`;
}

export function buildMetricsWiqlQueries(input: {
  scope: ServerMetricScope;
  period: ServerMetricPeriod;
  sprintId?: string;
  periodStart?: string;
}): string[] {
  if (input.period === 'current-sprint') {
    return [buildSprintMetricsQuery(input.sprintId ?? '', input.scope !== 'personal')];
  }

  if (!input.periodStart) {
    return [];
  }

  const assignment = input.scope === 'personal' ? ' AND [System.AssignedTo] = @Me' : '';
  const closed = `[Microsoft.VSTS.Common.ClosedDate] >= '${input.periodStart}'`;
  const changed = `[System.ChangedDate] >= '${input.periodStart}'`;

  return [
    `SELECT [System.Id] FROM WorkItems WHERE ${PROJECT_FILTER}${assignment} AND ${changed} AND [System.State] <> 'Removed'`,
    `SELECT [System.Id] FROM WorkItems WHERE ${PROJECT_FILTER}${assignment} AND ${closed}`,
  ];
}
