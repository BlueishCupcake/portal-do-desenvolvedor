export type MetricPeriod = 'current-sprint' | '7-days' | '30-days' | '90-days';

export type MetricScope = 'personal' | 'team' | 'project';

export type MetricSourceState = 'ok' | 'unavailable' | 'error';

export type MetricKpiKind = 'current' | 'period';

export interface MetricSourceStatus {
  workItems: MetricSourceState;
  pullRequests: MetricSourceState;
  pipelines: MetricSourceState;
}

export interface MetricSourceError {
  source: 'workItems' | 'pullRequests' | 'pipelines';
  message: string;
}

export interface MetricKpi {
  id: string;
  label: string;
  value: number;
  definition: string;
  kind: MetricKpiKind;
}

export interface MetricBreakdown {
  label: string;
  count: number;
}

export interface MetricWorkItemRow {
  id: number;
  title: string;
  type: string;
  state: string;
  assignedTo: string;
  updatedAt?: string;
  closedAt?: string;
  dueDate?: string;
  url?: string;
}

export interface MetricSprintProgress {
  completed: number;
  total: number;
  percent: number;
  definition: string;
}

export interface ScopeMetrics {
  kpis: MetricKpi[];
  byType: MetricBreakdown[];
  byState: MetricBreakdown[];
  byAssignee?: MetricBreakdown[];
  items: MetricWorkItemRow[];
  overdueAvailable: boolean;
  sprintProgress?: MetricSprintProgress;
}

export interface MetricsContext {
  organization: string;
  project: string;
  team: string;
  period: MetricPeriod;
  periodStart?: string;
  periodEnd?: string;
  sprintId?: string;
  sprintName?: string;
  permissionNote: string;
}

export interface VdmProgress {
  objective: number;
  closedInMonth: number;
  monthStart: string;
}

export interface MetricsDashboardData {
  generatedAt: string;
  context: MetricsContext;
  scope: MetricScope;
  metrics: ScopeMetrics | null;
  vdm?: VdmProgress;
  sources: MetricSourceStatus;
  errors: MetricSourceError[];
}

export interface MetricsQuery {
  scope: MetricScope;
  period: MetricPeriod;
  sprintId?: string;
}
