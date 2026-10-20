import { describe, expect, it } from 'vitest';

import { createWorkItem } from '@/test/factories/workItem.ts';
import { calculateScopeMetrics } from '@/utils/metrics/calculateMetrics.ts';

const user = { id: 'sophie', displayName: 'Sophie Quines' };
const now = new Date('2026-10-06T12:00:00.000Z');
const sprint = { startDate: '2026-10-01', endDate: '2026-10-15' };

const items = [
  createWorkItem({
    id: 1,
    title: 'Bug ativo',
    type: 'Bug',
    state: 'Active',
    assignedTo: 'Sophie Quines',
    assignedToId: 'sophie',
    dueDate: '2026-10-01',
    updatedAt: '2026-10-04',
  }),
  createWorkItem({
    id: 2,
    title: 'Task concluída',
    type: 'Task',
    state: 'Closed',
    assignedTo: 'Sophie Quines',
    assignedToId: 'sophie',
    closedAt: '2026-10-05',
    updatedAt: '2026-10-05',
  }),
  createWorkItem({
    id: 2,
    title: 'Task duplicada',
    type: 'Task',
    state: 'Closed',
    assignedTo: 'Sophie Quines',
    assignedToId: 'sophie',
    closedAt: '2026-10-05',
  }),
  createWorkItem({
    id: 3,
    title: 'Do colega',
    type: 'Task',
    state: 'Active',
    assignedTo: 'Alex Santos',
    assignedToId: 'alex',
    updatedAt: '2026-10-03',
  }),
  createWorkItem({
    id: 4,
    title: 'Sem responsável',
    type: 'Task',
    state: 'New',
    assignedTo: 'Não atribuído',
    updatedAt: '2026-10-03',
  }),
  createWorkItem({
    id: 5,
    title: 'Concluída fora do período',
    type: 'Bug',
    state: 'Closed',
    assignedTo: 'Sophie Quines',
    assignedToId: 'sophie',
    closedAt: '2026-09-20',
    updatedAt: '2026-09-20',
  }),
];

describe('calculateScopeMetrics', () => {
  it('scopes personal metrics by identity id and ignores display-name collisions', () => {
    const metrics = calculateScopeMetrics({
      items: [
        ...items,
        createWorkItem({
          id: 9,
          title: 'Homônimo',
          assignedTo: 'Sophie Quines',
          assignedToId: 'outra-pessoa',
          state: 'Active',
        }),
      ],
      scope: 'personal',
      period: 'current-sprint',
      user,
      sprint,
      pullRequestCount: 3,
      pipelineCount: 2,
      now,
    });

    expect(metrics.items.map((item) => item.id)).toEqual([1, 2, 5]);
    expect(metrics.kpis.find((kpi) => kpi.id === 'assigned')?.value).toBe(3);
    expect(metrics.kpis.find((kpi) => kpi.id === 'active')?.value).toBe(1);
    expect(metrics.kpis.find((kpi) => kpi.id === 'completed')?.value).toBe(1);
    expect(metrics.kpis.find((kpi) => kpi.id === 'bugs')?.value).toBe(2);
    expect(metrics.kpis.find((kpi) => kpi.id === 'overdue')?.value).toBe(1);
    expect(metrics.kpis.find((kpi) => kpi.id === 'pullRequests')?.value).toBe(3);
    expect(metrics.kpis.find((kpi) => kpi.id === 'pipelines')?.value).toBe(2);
    expect(metrics.overdueAvailable).toBe(true);
    expect(metrics.byAssignee).toBeUndefined();
    expect(metrics.sprintProgress).toBeUndefined();
  });

  it('calculates team totals, unassigned items and sprint progress from the scoped set', () => {
    const metrics = calculateScopeMetrics({
      items,
      scope: 'team',
      period: 'current-sprint',
      sprint,
      now,
    });

    expect(metrics.kpis.find((kpi) => kpi.id === 'active')?.value).toBe(3);
    expect(metrics.kpis.find((kpi) => kpi.id === 'unassigned')?.value).toBe(1);
    expect(metrics.kpis.find((kpi) => kpi.id === 'completed')?.value).toBe(1);
    expect(metrics.sprintProgress).toEqual({
      completed: 2,
      total: 5,
      percent: 40,
      definition: expect.stringContaining('média'),
    });
    expect(metrics.byType.find((item) => item.label === 'Task')?.count).toBe(3);
    expect(metrics.byAssignee?.find((item) => item.label === 'Alex Santos')?.count).toBe(
      1,
    );
  });

  it('omits overdue and optional sources when they are unavailable', () => {
    const metrics = calculateScopeMetrics({
      items: [createWorkItem({ id: 8, state: 'Active', assignedTo: 'Sophie Quines' })],
      scope: 'personal',
      period: '7-days',
      user,
      now,
    });

    expect(metrics.kpis.some((kpi) => kpi.id === 'overdue')).toBe(false);
    expect(metrics.kpis.some((kpi) => kpi.id === 'pullRequests')).toBe(false);
    expect(metrics.overdueAvailable).toBe(false);
  });

  it('does not treat an assigned item as completed', () => {
    const metrics = calculateScopeMetrics({
      items: [
        createWorkItem({
          id: 10,
          state: 'Active',
          assignedTo: 'Sophie Quines',
          assignedToId: 'sophie',
        }),
      ],
      scope: 'personal',
      period: 'current-sprint',
      user,
      sprint,
      now,
    });

    expect(metrics.kpis.find((kpi) => kpi.id === 'assigned')?.value).toBe(1);
    expect(metrics.kpis.find((kpi) => kpi.id === 'completed')?.value).toBe(0);
  });

  it('returns empty metrics without fabricating counts', () => {
    const metrics = calculateScopeMetrics({
      items: [],
      scope: 'project',
      period: '30-days',
      now,
    });

    expect(metrics.items).toEqual([]);
    expect(metrics.kpis.find((kpi) => kpi.id === 'active')?.value).toBe(0);
    expect(metrics.sprintProgress).toBeUndefined();
  });
});
