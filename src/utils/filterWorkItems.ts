import type { WorkItem, WorkItemTypeFilter } from '@/types/workItem.ts';

export function matchesType(
  item: WorkItem,
  typeFilter: WorkItemTypeFilter,
): boolean {
  if (typeFilter === 'all') {
    return true;
  }

  return item.type === typeFilter;
}

export function matchesState(item: WorkItem, state: string): boolean {
  if (state === 'all') {
    return true;
  }

  return item.state === state;
}

export function matchesBoardColumn(item: WorkItem, boardColumn: string): boolean {
  if (boardColumn === 'all') {
    return true;
  }

  return item.boardColumn === boardColumn;
}

export function uniqueSortedValues(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort(
    (left, right) => left.localeCompare(right, 'pt-BR'),
  );
}
