import { mapAzureWorkItem } from '@/mappers/azureDevOps/mapWorkItem.ts';
import { parseAzureWorkItemList } from '@/services/azureDevOps/parsers.ts';
import { AzureDevOpsError } from '@/services/azureDevOps/types.ts';
import type { Developer } from '@/types/developer.ts';
import type {
  MetricPeriod,
  MetricScope,
  MetricsDashboardData,
  MetricSourceError,
  MetricSourceState,
  MetricSourceStatus,
} from '@/types/metrics.ts';
import {
  isJsonObject,
  type JsonValue,
  readArrayField,
  readNumberField,
  readObjectField,
  readStringField,
} from '@/utils/json.ts';
import { buildMetricsDashboard } from '@/utils/metrics/buildMetricsDashboard.ts';

const SCOPES: MetricScope[] = ['personal', 'team', 'project'];
const PERIODS: MetricPeriod[] = ['current-sprint', '7-days', '30-days', '90-days'];
const SOURCE_STATES: MetricSourceState[] = ['ok', 'unavailable', 'error'];

function readSourceState(
  value: JsonValue | undefined,
  fallback: MetricSourceState,
): MetricSourceState {
  return typeof value === 'string' && SOURCE_STATES.includes(value as MetricSourceState)
    ? (value as MetricSourceState)
    : fallback;
}

function readScope(value: string | undefined, fallback: MetricScope): MetricScope {
  return value && SCOPES.includes(value as MetricScope)
    ? (value as MetricScope)
    : fallback;
}

function readPeriod(value: string | undefined, fallback: MetricPeriod): MetricPeriod {
  return value && PERIODS.includes(value as MetricPeriod)
    ? (value as MetricPeriod)
    : fallback;
}

function parseSources(payload: JsonValue | undefined): MetricSourceStatus {
  if (!payload || !isJsonObject(payload)) {
    return {
      workItems: 'ok',
      pullRequests: 'unavailable',
      pipelines: 'unavailable',
    };
  }

  return {
    workItems: readSourceState(payload.workItems, 'ok'),
    pullRequests: readSourceState(payload.pullRequests, 'unavailable'),
    pipelines: readSourceState(payload.pipelines, 'unavailable'),
  };
}

function parseErrors(payload: JsonValue): MetricSourceError[] {
  return (readArrayField(isJsonObject(payload) ? payload : {}, 'errors') ?? []).flatMap(
    (value) => {
      if (!isJsonObject(value)) {
        return [];
      }

      const source = readStringField(value, 'source');
      const message = readStringField(value, 'message');
      if (
        (source !== 'workItems' &&
          source !== 'pullRequests' &&
          source !== 'pipelines') ||
        !message
      ) {
        return [];
      }

      return [{ source, message }];
    },
  );
}

export function parseMetricsDashboard(
  payload: JsonValue,
  options: {
    scope: MetricScope;
    period: MetricPeriod;
    user?: Developer;
    now?: Date;
    vdmObjective?: number;
  },
): MetricsDashboardData {
  if (!isJsonObject(payload)) {
    throw new AzureDevOpsError('Resposta de métricas inválida.');
  }

  const context = readObjectField(payload, 'context') ?? {};
  const generatedAt = readStringField(payload, 'generatedAt') ?? new Date().toISOString();
  const vdmClosedInMonth = readNumberField(payload, 'vdmClosedInMonth');
  const workItems = parseAzureWorkItemList(
    Array.isArray(payload.workItems) ? payload.workItems : { value: payload.workItems ?? [] },
  ).map((item) => mapAzureWorkItem(item));

  return buildMetricsDashboard({
    generatedAt,
    scope: readScope(readStringField(payload, 'scope'), options.scope),
    period: readPeriod(readStringField(context, 'period'), options.period),
    context: {
      organization: readStringField(context, 'organization') ?? '',
      project: readStringField(context, 'project') ?? '',
      team: readStringField(context, 'team') ?? '',
      periodStart: readStringField(context, 'periodStart'),
      periodEnd: readStringField(context, 'periodEnd'),
      sprintId: readStringField(context, 'sprintId'),
      sprintName: readStringField(context, 'sprintName'),
    },
    items: workItems,
    user: options.user,
    pullRequestCount: readNumberField(payload, 'pullRequestCount'),
    pipelineCount: readNumberField(payload, 'pipelineCount'),
    vdm:
      vdmClosedInMonth === undefined
        ? undefined
        : {
            objective: options.vdmObjective ?? 7,
            closedInMonth: vdmClosedInMonth,
            monthStart:
              readStringField(payload, 'vdmMonthStart') ??
              readStringField(context, 'vdmMonthStart') ??
              '',
          },
    sources: parseSources(payload.sources),
    errors: parseErrors(payload),
    now: options.now,
  });
}
