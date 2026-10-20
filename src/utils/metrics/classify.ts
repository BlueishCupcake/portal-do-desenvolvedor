import type { WorkItem } from '@/types/workItem.ts';
import { isUtcDayBefore } from '@/utils/metrics/period.ts';
import { isResolvedWorkItemState } from '@/utils/resolveBugStatus.ts';

const INACTIVE_STATE_PATTERN = /remov|exclu|cancel/i;
export const UNASSIGNED_LABEL = 'Não atribuído';

export function isCompletedWorkItemState(state: string): boolean {
  return isResolvedWorkItemState(state);
}

export function isInactiveWorkItemState(state: string): boolean {
  return INACTIVE_STATE_PATTERN.test(state);
}

export function isActiveWorkItemState(state: string): boolean {
  return !isCompletedWorkItemState(state) && !isInactiveWorkItemState(state);
}

export function isUnassignedWorkItem(item: Pick<WorkItem, 'assignedTo'>): boolean {
  return item.assignedTo.trim().length === 0 || item.assignedTo === UNASSIGNED_LABEL;
}

export function isOverdueWorkItem(
  item: Pick<WorkItem, 'dueDate' | 'state'>,
  now: Date,
): boolean {
  if (!item.dueDate || !isActiveWorkItemState(item.state)) {
    return false;
  }

  return isUtcDayBefore(item.dueDate, now);
}

export function dedupeWorkItems<T extends { id: number }>(items: readonly T[]): T[] {
  const seen = new Set<number>();

  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }

    seen.add(item.id);
    return true;
  });
}
