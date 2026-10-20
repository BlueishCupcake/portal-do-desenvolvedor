import type { Developer } from '@/types/developer.ts';
import type { WorkItem } from '@/types/workItem.ts';

export type AssignedUser = Pick<Developer, 'id' | 'displayName'> & {
  email?: string;
};

export function isAssignedToUser(
  item: WorkItem,
  user: AssignedUser,
): boolean {
  if (user.id && item.assignedToId && item.assignedToId === user.id) {
    return true;
  }

  const email = user.email?.toLowerCase();
  if (email && item.assignedToUniqueName?.toLowerCase() === email) {
    return true;
  }

  return item.assignedTo === user.displayName;
}

export function sumAssignedStoryPoints(
  workItems: readonly WorkItem[],
  user?: string | AssignedUser,
): number {
  if (!user) {
    return 0;
  }

  const identity = typeof user === 'string' ? { displayName: user, id: user } : user;

  return workItems.reduce((total, item) => {
    if (!isAssignedToUser(item, identity)) {
      return total;
    }

    return total + (item.storyPoints ?? 0);
  }, 0);
}
