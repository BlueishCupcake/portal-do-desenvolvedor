import { describe, expect, it } from 'vitest';

import {
  buildMetricsWiqlQueries,
  buildSprintWorkItemsQuery,
  buildVdmClosedInMonthQuery,
  parseMetricsQuery,
  resolveRollingPeriodStart,
  startOfUtcMonth,
  uniqueWorkItemIds,
} from './metrics.ts';

describe('server metrics queries', () => {
  it('parses and rejects metric query params', () => {
    expect(parseMetricsQuery(new URLSearchParams())).toEqual({
      scope: 'personal',
      period: 'current-sprint',
      sprintId: undefined,
    });
    expect(
      parseMetricsQuery(
        new URLSearchParams('scope=team&period=7-days&sprintId=Sprint 42'),
      ),
    ).toEqual({
      scope: 'team',
      period: '7-days',
      sprintId: 'Sprint 42',
    });
    expect(() => parseMetricsQuery(new URLSearchParams('scope=other'))).toThrow(
      'Escopo',
    );
    expect(() => parseMetricsQuery(new URLSearchParams('period=year'))).toThrow(
      'Período',
    );
  });

  it('builds WIQL from official macros and fields only', () => {
    expect(
      buildMetricsWiqlQueries({
        scope: 'personal',
        period: 'current-sprint',
        sprintId: "Portal\\Sprint '42'",
      }),
    ).toEqual([
      "SELECT [System.Id] FROM WorkItems WHERE [System.TeamProject] = @project AND [System.IterationPath] UNDER 'Portal\\Sprint ''42''' AND [System.AssignedTo] = @Me",
    ]);

    expect(
      buildMetricsWiqlQueries({
        scope: 'team',
        period: 'current-sprint',
      }),
    ).toEqual([
      'SELECT [System.Id] FROM WorkItems WHERE [System.TeamProject] = @project AND [System.IterationPath] = @CurrentIteration',
    ]);

    expect(
      buildMetricsWiqlQueries({
        scope: 'personal',
        period: '7-days',
        periodStart: '2026-10-01T00:00:00.000Z',
      }),
    ).toEqual([
      "SELECT [System.Id] FROM WorkItems WHERE [System.TeamProject] = @project AND [System.AssignedTo] = @Me AND [System.ChangedDate] >= '2026-10-01T00:00:00.000Z' AND [System.State] <> 'Removed'",
      "SELECT [System.Id] FROM WorkItems WHERE [System.TeamProject] = @project AND [System.AssignedTo] = @Me AND [Microsoft.VSTS.Common.ClosedDate] >= '2026-10-01T00:00:00.000Z'",
    ]);

    expect(
      buildMetricsWiqlQueries({
        scope: 'project',
        period: '30-days',
        periodStart: '2026-09-01T00:00:00.000Z',
      })[0],
    ).toContain('[System.TeamProject] = @project');

    expect(
      buildMetricsWiqlQueries({
        scope: 'team',
        period: '7-days',
      }),
    ).toEqual([]);
  });

  it('resolves rolling period starts in UTC and deduplicates ids', () => {
    expect(
      resolveRollingPeriodStart('7-days', new Date('2026-10-16T15:00:00.000Z'))?.toISOString(),
    ).toBe('2026-10-09T00:00:00.000Z');
    expect(resolveRollingPeriodStart('current-sprint')).toBeUndefined();
    expect(uniqueWorkItemIds([1, 2, 1, 3])).toEqual([1, 2, 3]);
    expect(startOfUtcMonth(new Date('2026-10-16T15:00:00.000Z')).toISOString()).toBe(
      '2026-10-01T00:00:00.000Z',
    );
    expect(buildVdmClosedInMonthQuery('2026-10-01T00:00:00.000Z')).toBe(
      "SELECT [System.Id] FROM WorkItems WHERE [System.TeamProject] = @project AND [System.AssignedTo] = @Me AND [Microsoft.VSTS.Common.ClosedDate] >= '2026-10-01T00:00:00.000Z'",
    );
    expect(
      buildSprintWorkItemsQuery(
        ['Portal\\Sprint 42', 'Portal\\Sprint 41'],
        false,
      ),
    ).toBe(
      "SELECT [System.Id] FROM WorkItems WHERE [System.TeamProject] = @project AND ([System.IterationPath] UNDER 'Portal\\Sprint 42' OR [System.IterationPath] UNDER 'Portal\\Sprint 41') AND [System.AssignedTo] = @Me",
    );
  });
});
