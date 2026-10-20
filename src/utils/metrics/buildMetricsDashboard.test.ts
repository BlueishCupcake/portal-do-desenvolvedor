import { describe, expect, it } from 'vitest';

import { createWorkItem } from '@/test/factories/workItem.ts';
import { buildMetricsDashboard } from '@/utils/metrics/buildMetricsDashboard.ts';

describe('buildMetricsDashboard', () => {
  it('keeps metrics null when the work item source failed', () => {
    const dashboard = buildMetricsDashboard({
      generatedAt: '2026-10-06T12:00:00.000Z',
      scope: 'personal',
      period: 'current-sprint',
      context: {
        organization: 'contoso',
        project: 'portal',
        team: 'devs',
      },
      items: [createWorkItem()],
      sources: {
        workItems: 'error',
        pullRequests: 'unavailable',
        pipelines: 'unavailable',
      },
    });

    expect(dashboard.metrics).toBeNull();
    expect(dashboard.sources.workItems).toBe('error');
  });

  it('omits optional KPI sources that are not ok', () => {
    const dashboard = buildMetricsDashboard({
      generatedAt: '2026-10-06T12:00:00.000Z',
      scope: 'personal',
      period: '7-days',
      context: {
        organization: 'contoso',
        project: 'portal',
        team: 'devs',
      },
      items: [createWorkItem({ assignedTo: 'Sophie', assignedToId: 's1' })],
      user: { id: 's1', displayName: 'Sophie' },
      pullRequestCount: 9,
      pipelineCount: 4,
      sources: {
        workItems: 'ok',
        pullRequests: 'error',
        pipelines: 'unavailable',
      },
      errors: [{ source: 'pullRequests', message: 'sem permissão' }],
    });

    expect(dashboard.metrics?.kpis.some((kpi) => kpi.id === 'pullRequests')).toBe(
      false,
    );
    expect(dashboard.metrics?.kpis.some((kpi) => kpi.id === 'pipelines')).toBe(false);
    expect(dashboard.errors[0]?.message).toBe('sem permissão');
  });
});
