import { describe, expect, it } from 'vitest';

import type { MetricWorkItemRow } from '@/types/metrics.ts';
import { filterMetricItems } from '@/utils/metrics/filterMetricItems.ts';

const items: MetricWorkItemRow[] = [
  {
    id: 1,
    title: 'Bug ativo',
    type: 'Bug',
    state: 'Active',
    assignedTo: 'Sophie',
    dueDate: '2026-10-01',
    updatedAt: '2026-10-04',
  },
  {
    id: 2,
    title: 'Task fechada',
    type: 'Task',
    state: 'Closed',
    assignedTo: 'Sophie',
    closedAt: '2026-10-05',
    updatedAt: '2026-10-05',
  },
  {
    id: 3,
    title: 'Sem dono',
    type: 'Task',
    state: 'New',
    assignedTo: 'Não atribuído',
    updatedAt: '2026-10-03',
  },
];

const now = new Date('2026-10-06T12:00:00.000Z');
const sprint = { startDate: '2026-10-01', endDate: '2026-10-15' };

describe('filterMetricItems', () => {
  it('filters the detail list by the selected KPI', () => {
    expect(filterMetricItems(items, null, 'current-sprint', sprint, now)).toHaveLength(3);
    expect(
      filterMetricItems(items, 'active', 'current-sprint', sprint, now).map((item) => item.id),
    ).toEqual([1, 3]);
    expect(
      filterMetricItems(items, 'completed', 'current-sprint', sprint, now).map((item) => item.id),
    ).toEqual([2]);
    expect(
      filterMetricItems(items, 'bugs', 'current-sprint', sprint, now).map((item) => item.id),
    ).toEqual([1]);
    expect(
      filterMetricItems(items, 'overdue', 'current-sprint', sprint, now).map((item) => item.id),
    ).toEqual([1]);
    expect(
      filterMetricItems(items, 'unassigned', 'current-sprint', sprint, now).map((item) => item.id),
    ).toEqual([3]);
    expect(filterMetricItems(items, 'assigned', 'current-sprint', sprint, now)).toHaveLength(3);
    expect(filterMetricItems(items, 'pullRequests', 'current-sprint', sprint, now)).toHaveLength(
      3,
    );
  });
});
