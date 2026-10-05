import type { SortDirection, SortField, WorkItem } from '@/types/workItem.ts';

function compareNullableNumber(
  left: number | undefined,
  right: number | undefined,
): number {
  if (left === undefined && right === undefined) {
    return 0;
  }

  if (left === undefined) {
    return 1;
  }

  if (right === undefined) {
    return -1;
  }

  return left - right;
}

function compareNullableString(
  left: string | undefined,
  right: string | undefined,
): number {
  if (left === undefined && right === undefined) {
    return 0;
  }

  if (left === undefined) {
    return 1;
  }

  if (right === undefined) {
    return -1;
  }

  return left.localeCompare(right, 'pt-BR');
}

export function compareWorkItems(
  left: WorkItem,
  right: WorkItem,
  field: SortField,
): number {
  switch (field) {
    case 'id':
      return left.id - right.id;
    case 'title':
      return left.title.localeCompare(right.title, 'pt-BR');
    case 'type':
      return left.type.localeCompare(right.type, 'pt-BR');
    case 'state':
      return left.state.localeCompare(right.state, 'pt-BR');
    case 'priority':
      return compareNullableNumber(left.priority, right.priority);
    case 'updatedAt':
      return compareNullableString(left.updatedAt, right.updatedAt);
  }
}

export function sortWorkItems(
  items: WorkItem[],
  field: SortField,
  direction: SortDirection,
): WorkItem[] {
  const factor = direction === 'asc' ? 1 : -1;

  return [...items].sort(
    (left, right) => compareWorkItems(left, right, field) * factor,
  );
}
