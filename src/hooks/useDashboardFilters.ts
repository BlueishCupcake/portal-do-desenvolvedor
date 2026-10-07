import { useMemo, useState } from 'react';

import type {
  SortDirection,
  SortField,
  WorkItem,
  WorkItemTypeFilter,
} from '@/types/workItem.ts';
import {
  matchesBoardColumn,
  matchesDevelopers,
  matchesState,
  matchesType,
  uniqueSortedValues,
} from '@/utils/filterWorkItems.ts';
import { matchesSearch } from '@/utils/searchWorkItems.ts';
import { sortWorkItems } from '@/utils/sortWorkItems.ts';

export function useDashboardFilters(workItems: WorkItem[]) {
  const [type, setType] = useState<WorkItemTypeFilter>('all');
  const [state, setState] = useState('all');
  const [boardColumn, setBoardColumn] = useState('all');
  const [selectedDevelopers, setSelectedDevelopers] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('updatedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const boardColumns = useMemo(
    () => uniqueSortedValues(workItems.map((item) => item.boardColumn)),
    [workItems],
  );

  const states = useMemo(
    () => uniqueSortedValues(workItems.map((item) => item.state)),
    [workItems],
  );

  const developers = useMemo(
    () => uniqueSortedValues(workItems.map((item) => item.assignedTo)),
    [workItems],
  );

  const visibleItems = useMemo(() => {
    const filtered = workItems.filter(
      (item) =>
        matchesType(item, type) &&
        matchesState(item, state) &&
        matchesBoardColumn(item, boardColumn) &&
        matchesDevelopers(item, selectedDevelopers) &&
        matchesSearch(item, search),
    );

    return sortWorkItems(filtered, sortBy, sortDirection);
  }, [
    boardColumn,
    search,
    selectedDevelopers,
    sortBy,
    sortDirection,
    state,
    type,
    workItems,
  ]);

  const hasActiveFilters =
    type !== 'all' ||
    state !== 'all' ||
    boardColumn !== 'all' ||
    selectedDevelopers.length > 0 ||
    search.trim().length > 0;

  return {
    type,
    setType,
    state,
    setState,
    boardColumn,
    setBoardColumn,
    search,
    setSearch,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
    boardColumns,
    states,
    developers,
    selectedDevelopers,
    setSelectedDevelopers,
    visibleItems,
    hasActiveFilters,
  };
}
