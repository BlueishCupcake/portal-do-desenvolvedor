import { describe, expect, it } from 'vitest';

import { createWorkItem } from '@/test/factories/workItem.ts';
import {
  matchesBoardColumn,
  matchesState,
  matchesType,
  uniqueSortedValues,
} from '@/utils/filterWorkItems.ts';
import { matchesSearch } from '@/utils/searchWorkItems.ts';
import { compareWorkItems, sortWorkItems } from '@/utils/sortWorkItems.ts';

describe('work item query helpers', () => {
  const task = createWorkItem({
    id: 10,
    title: 'Implementar filtro',
    type: 'Task',
    state: 'Active',
    boardColumn: 'Doing',
    priority: 2,
    updatedAt: '2026-10-03',
  });
  const bug = createWorkItem({
    id: 2,
    title: 'Corrigir autenticação',
    type: 'Bug',
    state: 'Resolved',
    boardColumn: 'Ag. QA',
    priority: undefined,
    updatedAt: undefined,
  });

  it('filters by type, state, board column and search', () => {
    expect(matchesType(task, 'all')).toBe(true);
    expect(matchesType(task, 'Task')).toBe(true);
    expect(matchesType(bug, 'Task')).toBe(false);
    expect(matchesState(task, 'all')).toBe(true);
    expect(matchesState(task, 'Active')).toBe(true);
    expect(matchesBoardColumn(task, 'all')).toBe(true);
    expect(matchesBoardColumn(task, 'Doing')).toBe(true);
    expect(matchesSearch(task, '')).toBe(true);
    expect(matchesSearch(task, '10')).toBe(true);
    expect(matchesSearch(task, 'task')).toBe(true);
    expect(matchesSearch(task, 'active')).toBe(true);
    expect(matchesSearch(task, 'xyz')).toBe(false);
    expect(uniqueSortedValues(['QA', '', 'Doing', 'QA'])).toEqual(['Doing', 'QA']);
  });

  it('sorts work items by the selected field', () => {
    const items = [task, bug];

    expect(sortWorkItems(items, 'id', 'asc').map((item) => item.id)).toEqual([
      2, 10,
    ]);
    expect(sortWorkItems(items, 'title', 'asc')[0]?.title).toBe(
      'Corrigir autenticação',
    );
    expect(sortWorkItems(items, 'type', 'asc')[0]?.type).toBe('Bug');
    expect(sortWorkItems(items, 'state', 'desc')[0]?.state).toBe('Resolved');
    expect(sortWorkItems(items, 'priority', 'asc')[0]?.id).toBe(10);
    expect(sortWorkItems(items, 'updatedAt', 'asc')[0]?.id).toBe(10);
    expect(compareWorkItems(task, task, 'priority')).toBe(0);
    expect(compareWorkItems(bug, bug, 'updatedAt')).toBe(0);
  });
});
