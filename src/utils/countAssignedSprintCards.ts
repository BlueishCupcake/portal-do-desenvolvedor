import type { WorkItem } from '@/types/workItem.ts';
import { isResolvedWorkItemState } from '@/utils/resolveBugStatus.ts';
import {
  type AssignedUser,
  isAssignedToUser,
} from '@/utils/sumAssignedStoryPoints.ts';

export interface SprintCardCounts {
  pulled: number;
  closed: number;
}

function normalizeBoardColumn(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

export function countAssignedSprintCards(
  workItems: readonly WorkItem[],
  user?: string | AssignedUser,
): SprintCardCounts {
  if (!user) {
    return { pulled: 0, closed: 0 };
  }

  const identity = typeof user === 'string' ? { displayName: user, id: user } : user;
  const assignedItems = workItems.filter((item) =>
    isAssignedToUser(item, identity),
  );

  return {
    pulled: assignedItems.filter(
      (item) => normalizeBoardColumn(item.boardColumn) !== 'agdesenvolvimento',
    ).length,
    closed: assignedItems.filter((item) =>
      isResolvedWorkItemState(item.state),
    ).length,
  };
}
