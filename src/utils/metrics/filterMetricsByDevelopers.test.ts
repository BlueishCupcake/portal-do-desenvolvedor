import { describe, expect, it } from 'vitest';

import { createWorkItem } from '@/test/factories/workItem.ts';
import { calculateScopeMetrics } from '@/utils/metrics/calculateMetrics.ts';
import { filterMetricsByDevelopers } from '@/utils/metrics/filterMetricsByDevelopers.ts';

const now = new Date('2026-10-06T12:00:00.000Z');
const sprint = { startDate: '2026-10-01', endDate: '2026-10-15' };

const metrics = calculateScopeMetrics({
  items: [
    createWorkItem({
      id: 1,
      title: 'Da Sophie',
      type: 'Bug',
      state: 'Active',
      assignedTo: 'Sophie Quines',
      updatedAt: '2026-10-04',
    }),
    createWorkItem({
      id: 2,
      title: 'Do Alex',
      type: 'Task',
      state: 'Active',
      assignedTo: 'Alex Santos',
      updatedAt: '2026-10-04',
    }),
  ],
  scope: 'team',
  period: 'current-sprint',
  sprint,
  now,
});

describe('filterMetricsByDevelopers', () => {
  it('keeps the original metrics when no developer is selected', () => {
    expect(filterMetricsByDevelopers(metrics, [], { scope: 'team', period: 'current-sprint', sprint, now })).toBe(
      metrics,
    );
  });

  it('recalculates team KPIs for the selected developers without inventing sources', () => {
    const filtered = filterMetricsByDevelopers(metrics, ['Alex Santos'], {
      scope: 'team',
      period: 'current-sprint',
      sprint,
      now,
    });

    expect(filtered.items.map((item) => item.id)).toEqual([2]);
    expect(filtered.kpis.find((kpi) => kpi.id === 'active')?.value).toBe(1);
    expect(filtered.kpis.find((kpi) => kpi.id === 'bugs')?.value).toBe(0);
    expect(filtered.kpis.some((kpi) => kpi.id === 'pullRequests')).toBe(false);
    expect(filtered.byAssignee).toEqual([{ label: 'Alex Santos', count: 1 }]);
  });
});
