import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useDashboardFilters } from '@/hooks/useDashboardFilters.ts';
import { createWorkItem } from '@/test/factories/workItem.ts';

describe('useDashboardFilters', () => {
  it('filters and sorts work items on the client', () => {
    const items = [
      createWorkItem({
        id: 2,
        title: 'Beta',
        type: 'Bug',
        boardColumn: 'QA',
        assignedTo: 'Alex',
      }),
      createWorkItem({
        id: 1,
        title: 'Alpha',
        type: 'Task',
        boardColumn: 'Doing',
        assignedTo: 'Sophie',
      }),
    ];

    const { result } = renderHook(() => useDashboardFilters(items));

    act(() => {
      result.current.setType('Bug');
    });
    expect(result.current.visibleItems).toHaveLength(1);

    act(() => {
      result.current.setType('all');
      result.current.setSearch('Alpha');
      result.current.setSortBy('title');
      result.current.setSortDirection('asc');
      result.current.setState('Active');
      result.current.setBoardColumn('Doing');
    });

    expect(result.current.visibleItems.map((item) => item.title)).toEqual(['Alpha']);
    expect(result.current.hasActiveFilters).toBe(true);
    expect(result.current.boardColumns).toEqual(['Doing', 'QA']);
    expect(result.current.developers).toEqual(['Alex', 'Sophie']);

    act(() => {
      result.current.setSearch('');
      result.current.setState('all');
      result.current.setBoardColumn('all');
      result.current.setSelectedDevelopers(['Alex']);
    });
    expect(result.current.visibleItems.map((item) => item.title)).toEqual(['Beta']);
  });
});
