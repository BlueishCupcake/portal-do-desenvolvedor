import { describe, expect, it } from 'vitest';

import { parseMetricsDashboard } from '@/services/azureDevOps/metricsParser.ts';
import { AzureDevOpsError } from '@/services/azureDevOps/types.ts';

const azureItem = {
  id: 88,
  url: 'https://dev.azure.com/88',
  fields: {
    'System.Title': 'Tarefa',
    'System.WorkItemType': 'Task',
    'System.State': 'Active',
    'System.AssignedTo': { displayName: 'Sophie', id: 'u1' },
    'System.IterationPath': 'Sprint 42',
  },
};

describe('parseMetricsDashboard', () => {
  it('maps a valid metrics payload into domain KPIs', () => {
    const dashboard = parseMetricsDashboard(
      {
        generatedAt: '2026-10-06T12:00:00.000Z',
        context: {
          organization: 'contoso',
          project: 'portal',
          team: 'devs',
          period: 'current-sprint',
        },
        workItems: [azureItem],
        pullRequestCount: 2,
        pipelineCount: 1,
        vdmClosedInMonth: 2,
        vdmMonthStart: '2026-10-01T00:00:00.000Z',
        sources: {
          workItems: 'ok',
          pullRequests: 'ok',
          pipelines: 'ok',
        },
        errors: [{ source: 'pipelines', message: 'página limitada' }],
      },
      { scope: 'personal', period: 'current-sprint' },
    );

    expect(dashboard.metrics?.items[0]?.id).toBe(88);
    expect(dashboard.metrics?.kpis.find((kpi) => kpi.id === 'pullRequests')?.value).toBe(
      2,
    );
    expect(dashboard.errors[0]?.message).toBe('página limitada');
    expect(dashboard.vdm).toEqual({
      objective: 7,
      closedInMonth: 2,
      monthStart: '2026-10-01T00:00:00.000Z',
    });
  });

  it('rejects an invalid payload and ignores malformed optional errors', () => {
    expect(() =>
      parseMetricsDashboard(null, { scope: 'personal', period: '7-days' }),
    ).toThrow(AzureDevOpsError);

    const dashboard = parseMetricsDashboard(
      {
        generatedAt: '2026-10-06T12:00:00.000Z',
        context: { period: '7-days' },
        workItems: [azureItem],
        sources: {},
        errors: [{ source: 'unknown', message: 'x' }, 'nope'],
      },
      { scope: 'team', period: '7-days' },
    );

    expect(dashboard.errors).toEqual([]);
    expect(dashboard.sources.pullRequests).toBe('unavailable');
  });
});
